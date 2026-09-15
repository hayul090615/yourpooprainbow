import { pool } from '../../backend/src/db/pool.js';
import { findSessionUser } from '../../backend/src/services/auth-service.js';

type ApiRequest = { method?: string; query: { id?: string | string[] }; headers: { authorization?: string | string[] } };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void; end(): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'OPTIONS') { response.setHeader('Allow', 'DELETE, OPTIONS'); response.status(204).end(); return; }
  if (request.method !== 'DELETE') { response.setHeader('Allow', 'DELETE, OPTIONS'); response.status(405).json({ message: 'DELETE 요청만 지원합니다.' }); return; }
  const auth = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  const user = await findSessionUser(auth);
  if (!user) { response.status(401).json({ message: '로그인이 필요합니다.' }); return; }
  const id = Array.isArray(request.query.id) ? request.query.id[0] ?? '' : request.query.id ?? '';
  if (!/^[1-9]\d*$/.test(id)) { response.status(400).json({ message: '리뷰 번호가 올바르지 않습니다.' }); return; }
  try { const result = user.role === 'admin' ? await pool.query('DELETE FROM public.toilet_reviews WHERE id = $1 RETURNING id;', [id]) : await pool.query('DELETE FROM public.toilet_reviews WHERE id = $1 AND author_user_id = $2 RETURNING id;', [id, user.id]); if (!result.rows[0]) { response.status(404).json({ message: '리뷰를 찾을 수 없습니다.' }); return; } response.status(204).end(); } catch (error) { console.error('Failed to delete toilet review:', error); response.status(500).json({ message: '리뷰를 삭제하지 못했습니다.' }); }
}
