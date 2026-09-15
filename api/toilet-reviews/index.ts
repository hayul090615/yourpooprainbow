import { pool } from '../../backend/src/db/pool.js';
import { findSessionUser } from '../../backend/src/services/auth-service.js';

type ApiRequest = { method?: string; body?: unknown; query: { toiletId?: string | string[] }; headers: { authorization?: string | string[] } };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void; end(): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'OPTIONS') { response.setHeader('Allow', 'GET, POST, OPTIONS'); response.status(204).end(); return; }
  if (request.method === 'GET') {
    const toiletId = Array.isArray(request.query.toiletId) ? request.query.toiletId[0] ?? '' : request.query.toiletId ?? '';
    if (!toiletId || toiletId.length > 200) { response.status(400).json({ message: '화장실 정보를 확인해 주세요.' }); return; }
    try {
      const result = await pool.query(`SELECT toilet_reviews.id, toilet_reviews.toilet_id AS "toiletId", toilet_reviews.rating, toilet_reviews.cleanliness, toilet_reviews.content, toilet_reviews.created_at AS "createdAt", toilet_reviews.updated_at AS "updatedAt", users.id AS "authorUserId", users.name AS "authorName", COUNT(toilet_review_likes.user_id)::int AS "likeCount" FROM public.toilet_reviews JOIN public.users ON users.id = toilet_reviews.author_user_id LEFT JOIN public.toilet_review_likes ON toilet_review_likes.review_id = toilet_reviews.id WHERE toilet_reviews.toilet_id = $1 GROUP BY toilet_reviews.id, users.id ORDER BY toilet_reviews.updated_at DESC;`, [toiletId]);
      response.status(200).json({ reviews: result.rows });
    } catch (error) { console.error('Failed to get toilet reviews:', error); response.status(500).json({ message: '리뷰를 불러오지 못했습니다.' }); }
    return;
  }
  if (request.method !== 'POST') { response.setHeader('Allow', 'GET, POST, OPTIONS'); response.status(405).json({ message: '지원하지 않는 요청입니다.' }); return; }
  const auth = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  const user = await findSessionUser(auth);
  if (!user) { response.status(401).json({ message: '로그인이 필요합니다.' }); return; }
  const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
  const toiletId = typeof body.toiletId === 'string' ? body.toiletId.trim() : '';
  const toiletName = typeof body.toiletName === 'string' ? body.toiletName.trim() : '';
  const rating = body.rating;
  const cleanliness = body.cleanliness;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!toiletId || toiletId.length > 200 || !toiletName || toiletName.length > 200 || !Number.isInteger(rating) || !Number.isInteger(cleanliness) || Number(rating) < 1 || Number(rating) > 5 || Number(cleanliness) < 1 || Number(cleanliness) > 5 || content.length < 5 || content.length > 500) { response.status(400).json({ message: '별점·청결도와 5~500자 리뷰를 확인해 주세요.' }); return; }
  try {
    await pool.query(`INSERT INTO public.toilet_reviews (toilet_id, toilet_name, author_user_id, rating, cleanliness, content) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (author_user_id, toilet_id) DO UPDATE SET toilet_name = EXCLUDED.toilet_name, rating = EXCLUDED.rating, cleanliness = EXCLUDED.cleanliness, content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP;`, [toiletId, toiletName, user.id, rating, cleanliness, content]);
    response.status(201).json({ message: '리뷰가 저장되었습니다.' });
  } catch (error) { console.error('Failed to save toilet review:', error); response.status(500).json({ message: '리뷰를 저장하지 못했습니다.' }); }
}
