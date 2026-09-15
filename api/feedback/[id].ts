import { pool } from '../../backend/src/db/pool.js';
import { findSessionUser } from '../../backend/src/services/auth-service.js';

type ApiRequest = { method?: string; body?: unknown; query: { id?: string | string[] }; headers: { authorization?: string | string[] } };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void; end(): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'OPTIONS') { response.setHeader('Allow', 'PATCH, OPTIONS'); response.status(204).end(); return; }
  if (request.method !== 'PATCH') { response.setHeader('Allow', 'PATCH, OPTIONS'); response.status(405).json({ message: 'Method not allowed.' }); return; }
  const authorization = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  const user = await findSessionUser(authorization);
  if (!user) { response.status(401).json({ message: 'Login is required.' }); return; }
  if (user.role !== 'admin') { response.status(403).json({ message: 'Administrator access is required.' }); return; }
  const id = Array.isArray(request.query.id) ? request.query.id[0] ?? '' : request.query.id ?? '';
  const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
  const status = body.status;
  const adminReply = typeof body.adminReply === 'string' ? body.adminReply.trim() : null;
  const notifyUser = body.notifyUser === true;
  if (!/^[1-9]\d*$/.test(id) || !['received', 'reviewing', 'resolved'].includes(String(status))) { response.status(400).json({ message: 'Invalid feedback request.' }); return; }
  if (adminReply && adminReply.length > 1000) { response.status(400).json({ message: 'Reply must be 1000 characters or fewer.' }); return; }
  try {
    const result = await pool.query(`UPDATE public.feedback SET status = $1, admin_reply = $2, replied_at = CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE replied_at END, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, sender_user_id, title, status, admin_reply AS "adminReply", updated_at AS "updatedAt";`, [status, adminReply, notifyUser, id]);
    const feedback = result.rows[0];
    if (!feedback) { response.status(404).json({ message: 'Feedback not found.' }); return; }
    if (notifyUser && adminReply) {
      await pool.query('INSERT INTO public.user_notifications (recipient_user_id, feedback_id, title, message) VALUES ($1, $2, $3, $4);', [feedback.sender_user_id, feedback.id, `피드백 답변: ${feedback.title}`, adminReply]);
    }
    response.status(200).json({ feedback });
  } catch (error) {
    console.error('Failed to update feedback:', error);
    response.status(500).json({ message: 'Could not update feedback.' });
  }
}
