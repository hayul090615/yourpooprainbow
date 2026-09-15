import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, type AuthUser } from '../services/auth-service';

export const toiletReviewsRouter = Router();

toiletReviewsRouter.get('/', async (request, response, next) => {
  const toiletId = typeof request.query.toiletId === 'string' ? request.query.toiletId.trim() : '';
  if (!toiletId || toiletId.length > 200) { response.status(400).json({ message: '화장실 정보를 확인해 주세요.' }); return; }
  try {
    const result = await pool.query(`SELECT toilet_reviews.id, toilet_reviews.toilet_id AS "toiletId", toilet_reviews.rating, toilet_reviews.cleanliness, toilet_reviews.content, toilet_reviews.created_at AS "createdAt", toilet_reviews.updated_at AS "updatedAt", users.id AS "authorUserId", users.name AS "authorName", COUNT(toilet_review_likes.user_id)::int AS "likeCount" FROM public.toilet_reviews JOIN public.users ON users.id = toilet_reviews.author_user_id LEFT JOIN public.toilet_review_likes ON toilet_review_likes.review_id = toilet_reviews.id WHERE toilet_reviews.toilet_id = $1 GROUP BY toilet_reviews.id, users.id ORDER BY toilet_reviews.updated_at DESC;`, [toiletId]);
    response.json({ reviews: result.rows });
  } catch (error) { next(error); }
});

toiletReviewsRouter.post('/:id/like', requireAuth, async (request, response, next) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] ?? '' : request.params.id;
  if (!/^[1-9]\d*$/.test(id)) { response.status(400).json({ message: '리뷰 번호가 올바르지 않습니다.' }); return; }
  try {
    const user = response.locals.authUser as AuthUser;
    const removed = await pool.query('DELETE FROM public.toilet_review_likes WHERE review_id = $1 AND user_id = $2 RETURNING review_id;', [id, user.id]);
    let liked = false;
    if (!removed.rows[0]) { const inserted = await pool.query('INSERT INTO public.toilet_review_likes (review_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING review_id;', [id, user.id]); liked = Boolean(inserted.rows[0]); }
    const count = await pool.query<{ like_count: string }>('SELECT COUNT(*)::text AS like_count FROM public.toilet_review_likes WHERE review_id = $1;', [id]);
    response.json({ liked, likeCount: Number(count.rows[0].like_count) });
  } catch (error) { next(error); }
});

toiletReviewsRouter.post('/', requireAuth, async (request, response, next) => {
  const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
  const toiletId = typeof body.toiletId === 'string' ? body.toiletId.trim() : '';
  const toiletName = typeof body.toiletName === 'string' ? body.toiletName.trim() : '';
  const rating = body.rating;
  const cleanliness = body.cleanliness;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!toiletId || toiletId.length > 200 || !toiletName || toiletName.length > 200 || !Number.isInteger(rating) || !Number.isInteger(cleanliness) || Number(rating) < 1 || Number(rating) > 5 || Number(cleanliness) < 1 || Number(cleanliness) > 5 || content.length < 5 || content.length > 500) { response.status(400).json({ message: '별점·청결도와 5~500자 리뷰를 확인해 주세요.' }); return; }
  try {
    const user = response.locals.authUser as AuthUser;
    await pool.query(`INSERT INTO public.toilet_reviews (toilet_id, toilet_name, author_user_id, rating, cleanliness, content) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (author_user_id, toilet_id) DO UPDATE SET toilet_name = EXCLUDED.toilet_name, rating = EXCLUDED.rating, cleanliness = EXCLUDED.cleanliness, content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP;`, [toiletId, toiletName, user.id, rating, cleanliness, content]);
    response.status(201).json({ message: '리뷰가 저장되었습니다.' });
  } catch (error) { next(error); }
});

toiletReviewsRouter.delete('/:id', requireAuth, async (request, response, next) => {
  const id = Array.isArray(request.params.id) ? request.params.id[0] ?? '' : request.params.id;
  if (!/^[1-9]\d*$/.test(id)) { response.status(400).json({ message: '리뷰 번호가 올바르지 않습니다.' }); return; }
  const user = response.locals.authUser as AuthUser;
  try {
    const result = user.role === 'admin'
      ? await pool.query('DELETE FROM public.toilet_reviews WHERE id = $1 RETURNING id;', [id])
      : await pool.query('DELETE FROM public.toilet_reviews WHERE id = $1 AND author_user_id = $2 RETURNING id;', [id, user.id]);
    if (!result.rows[0]) { response.status(404).json({ message: '리뷰를 찾을 수 없습니다.' }); return; }
    response.status(204).send();
  } catch (error) { next(error); }
});
