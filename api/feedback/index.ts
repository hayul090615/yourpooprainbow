import { pool } from '../../backend/src/db/pool.js';
import { findSessionUser } from '../../backend/src/services/auth-service.js';

type ApiRequest = { method?: string; body?: unknown; headers: { authorization?: string | string[] } };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void; end(): void };

function authorization(request: ApiRequest): string | undefined {
  return Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'OPTIONS') { response.setHeader('Allow', 'GET, POST, OPTIONS'); response.status(204).end(); return; }
  const user = await findSessionUser(authorization(request));
  if (!user) { response.status(401).json({ message: '로그인이 필요합니다.' }); return; }

  if (request.method === 'POST') {
    const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
    const type = body.type;
    const area = body.area;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!['bug', 'suggestion', 'toilet_update'].includes(String(type)) || !['map', 'service', 'auth', 'other'].includes(String(area))) { response.status(400).json({ message: '피드백 유형 또는 관련 화면이 올바르지 않습니다.' }); return; }
    if (title.length < 3 || title.length > 80 || message.length < 10 || message.length > 1000) { response.status(400).json({ message: '제목은 3~80자, 상세 내용은 10~1000자로 입력해 주세요.' }); return; }
    try {
      const result = await pool.query(`INSERT INTO public.feedback (sender_user_id, type, area, title, message) VALUES ($1, $2, $3, $4, $5) RETURNING id, type, area, title, message, status, created_at AS "createdAt";`, [user.id, type, area, title, message]);
      response.status(201).json({ feedback: result.rows[0] });
    } catch (error) { console.error('Failed to create feedback:', error); response.status(500).json({ message: '피드백을 저장하지 못했습니다.' }); }
    return;
  }

  if (request.method !== 'GET') { response.setHeader('Allow', 'GET, POST, OPTIONS'); response.status(405).json({ message: '지원하지 않는 요청입니다.' }); return; }
  if (user.role !== 'admin') { response.status(403).json({ message: '관리자 권한이 필요합니다.' }); return; }
  try {
    const result = await pool.query(`SELECT feedback.id, feedback.type, feedback.area, feedback.title, feedback.message, feedback.status, feedback.admin_note AS "adminNote", feedback.admin_reply AS "adminReply", feedback.created_at AS "createdAt", feedback.updated_at AS "updatedAt", users.id AS "senderId", users.name AS "senderName", users.email AS "senderEmail", COUNT(feedback_likes.user_id)::int AS "likeCount" FROM public.feedback JOIN public.users ON users.id = feedback.sender_user_id LEFT JOIN public.feedback_likes ON feedback_likes.feedback_id = feedback.id GROUP BY feedback.id, users.id ORDER BY feedback.created_at DESC;`);
    response.status(200).json({ feedback: result.rows });
  } catch (error) { console.error('Failed to get feedback:', error); response.status(500).json({ message: '피드백을 불러오지 못했습니다.' }); }
}
