import { pool } from '../../../backend/src/db/pool.js';
import { findSessionUser } from '../../../backend/src/services/auth-service.js';

type ApiRequest = { method?: string; query: { id?: string | string[] }; headers: { authorization?: string | string[] } };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void; end(): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') { response.status(405).json({ message: 'POST 요청만 지원합니다.' }); return; }
  const auth = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  const user = await findSessionUser(auth);
  if (!user) { response.status(401).json({ message: '로그인이 필요합니다.' }); return; }
  const id = Array.isArray(request.query.id) ? request.query.id[0] ?? '' : request.query.id ?? '';
  if (!/^[1-9]\d*$/.test(id)) { response.status(400).json({ message: '피드백 번호가 올바르지 않습니다.' }); return; }
  try {
    const removed = await pool.query('DELETE FROM public.feedback_likes WHERE feedback_id = $1 AND user_id = $2 RETURNING feedback_id;', [id, user.id]);
    let liked = false;
    if (!removed.rows[0]) { const inserted = await pool.query('INSERT INTO public.feedback_likes (feedback_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING feedback_id;', [id, user.id]); liked = Boolean(inserted.rows[0]); }
    const count = await pool.query<{ like_count: string }>('SELECT COUNT(*)::text AS like_count FROM public.feedback_likes WHERE feedback_id = $1;', [id]);
    response.status(200).json({ liked, likeCount: Number(count.rows[0].like_count) });
  } catch (error) { console.error('Failed to toggle feedback like:', error); response.status(500).json({ message: '좋아요를 변경하지 못했습니다.' }); }
}
