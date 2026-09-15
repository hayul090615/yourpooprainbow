import { pool } from '../../../backend/src/db/pool.js';
import { findSessionUser } from '../../../backend/src/services/auth-service.js';

type ApiRequest = { method?: string; query: { id?: string | string[] }; headers: { authorization?: string | string[] } };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void; end(): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'OPTIONS') { response.setHeader('Allow', 'POST, OPTIONS'); response.status(204).end(); return; }
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST, OPTIONS'); response.status(405).json({ message: 'Method not allowed.' }); return; }
  const authorization = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  const user = await findSessionUser(authorization);
  if (!user) { response.status(401).json({ message: 'Login is required.' }); return; }
  const id = Array.isArray(request.query.id) ? request.query.id[0] ?? '' : request.query.id ?? '';
  if (!/^[1-9]\d*$/.test(id)) { response.status(400).json({ message: 'Invalid review id.' }); return; }
  try {
    const removed = await pool.query('DELETE FROM public.toilet_review_likes WHERE review_id = $1 AND user_id = $2 RETURNING review_id;', [id, user.id]);
    let liked = false;
    if (!removed.rows[0]) {
      const inserted = await pool.query('INSERT INTO public.toilet_review_likes (review_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING review_id;', [id, user.id]);
      liked = Boolean(inserted.rows[0]);
    }
    const count = await pool.query<{ like_count: string }>('SELECT COUNT(*)::text AS like_count FROM public.toilet_review_likes WHERE review_id = $1;', [id]);
    response.status(200).json({ liked, likeCount: Number(count.rows[0].like_count) });
  } catch (error) {
    console.error('Failed to toggle review like:', error);
    response.status(500).json({ message: 'Could not update the review like.' });
  }
}
