import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAdmin, requireAuth, type AuthUser } from '../services/auth-service';

type FeedbackStatus = 'received' | 'reviewing' | 'resolved';

export const feedbackRouter = Router();

feedbackRouter.post('/', requireAuth, async (_request, _response, next) => {
  const request = _request;
  const response = _response;
  const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
  const type = body.type;
  const area = body.area;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!['bug', 'suggestion', 'toilet_update'].includes(String(type)) || !['map', 'service', 'auth', 'other'].includes(String(area))) {
    response.status(400).json({ message: '피드백 유형 또는 관련 화면이 올바르지 않습니다.' });
    return;
  }
  if (title.length < 3 || title.length > 80 || message.length < 10 || message.length > 1000) {
    response.status(400).json({ message: '제목은 3~80자, 상세 내용은 10~1000자로 입력해 주세요.' });
    return;
  }

  try {
    const user = response.locals.authUser as AuthUser;
    const result = await pool.query(
      `INSERT INTO public.feedback (sender_user_id, type, area, title, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, area, title, message, status, created_at AS "createdAt";`,
      [user.id, type, area, title, message],
    );
    response.status(201).json({ feedback: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

feedbackRouter.get('/', requireAdmin, async (_request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT feedback.id, feedback.type, feedback.area, feedback.title, feedback.message,
              feedback.status, feedback.admin_note AS "adminNote", feedback.admin_reply AS "adminReply",
              feedback.created_at AS "createdAt", feedback.updated_at AS "updatedAt",
              users.id AS "senderId", users.name AS "senderName", users.email AS "senderEmail",
              COUNT(feedback_likes.user_id)::int AS "likeCount"
       FROM public.feedback
       JOIN public.users ON users.id = feedback.sender_user_id
       LEFT JOIN public.feedback_likes ON feedback_likes.feedback_id = feedback.id
       GROUP BY feedback.id, users.id
       ORDER BY feedback.created_at DESC;`,
    );
    response.json({ feedback: result.rows });
  } catch (error) {
    next(error);
  }
});

feedbackRouter.patch('/:id', requireAdmin, async (request, response, next) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] ?? '' : request.params.id;
  const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
  const status = body.status as FeedbackStatus;
  const adminReply = typeof body.adminReply === 'string' ? body.adminReply.trim() : null;
  const notifyUser = body.notifyUser === true;

  if (!/^[1-9]\d*$/.test(id) || !['received', 'reviewing', 'resolved'].includes(status)) {
    response.status(400).json({ message: '피드백 번호 또는 상태가 올바르지 않습니다.' });
    return;
  }
  if (adminReply && adminReply.length > 1000) {
    response.status(400).json({ message: '관리자 답변은 1000자 이하로 입력해 주세요.' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE public.feedback
       SET status = $1, admin_reply = $2,
           replied_at = CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE replied_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, sender_user_id, status, admin_reply AS "adminReply", updated_at AS "updatedAt";`,
      [status, adminReply, notifyUser, id],
    );
    if (!result.rows[0]) {
      response.status(404).json({ message: '피드백을 찾을 수 없습니다.' });
      return;
    }
    const feedback = result.rows[0];
    if (notifyUser && adminReply) {
      await pool.query(
        `INSERT INTO public.user_notifications (recipient_user_id, feedback_id, title, message)
         VALUES ($1, $2, '피드백 답변이 도착했습니다', $3);`,
        [feedback.sender_user_id, feedback.id, adminReply],
      );
    }
    response.json({ feedback });
  } catch (error) {
    next(error);
  }
});

feedbackRouter.post('/:id/like', requireAuth, async (request, response, next) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] ?? '' : request.params.id;
  if (!/^[1-9]\d*$/.test(id)) { response.status(400).json({ message: '피드백 번호가 올바르지 않습니다.' }); return; }
  try {
    const user = response.locals.authUser as AuthUser;
    const removed = await pool.query('DELETE FROM public.feedback_likes WHERE feedback_id = $1 AND user_id = $2 RETURNING feedback_id;', [id, user.id]);
    let liked = false;
    if (!removed.rows[0]) {
      const inserted = await pool.query('INSERT INTO public.feedback_likes (feedback_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING feedback_id;', [id, user.id]);
      liked = Boolean(inserted.rows[0]);
    }
    const count = await pool.query<{ like_count: string }>('SELECT COUNT(*)::text AS like_count FROM public.feedback_likes WHERE feedback_id = $1;', [id]);
    response.json({ liked, likeCount: Number(count.rows[0].like_count) });
  } catch (error) { next(error); }
});
