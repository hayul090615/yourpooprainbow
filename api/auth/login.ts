import { pool } from '../../backend/src/db/pool.js';
import { createSession, toAuthUser, verifyPassword } from '../../backend/src/services/auth-service.js';

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void; end(): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'OPTIONS') { response.setHeader('Allow', 'POST, OPTIONS'); response.status(204).end(); return; }
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST, OPTIONS'); response.status(405).json({ message: 'POST 요청만 지원합니다.' }); return; }
  const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) { response.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' }); return; }
  try {
    const result = await pool.query('SELECT id, email, name, profile_image, role, password_hash FROM public.users WHERE email = $1;', [email]);
    const row = result.rows[0];
    if (!row?.password_hash || !(await verifyPassword(password, row.password_hash))) { response.status(401).json({ message: '이메일 또는 비밀번호를 확인해 주세요.' }); return; }
    const user = toAuthUser(row);
    response.status(200).json({ user, token: await createSession(user.id) });
  } catch (error) { console.error('Failed to sign in:', error); response.status(500).json({ message: '로그인을 처리하지 못했습니다.' }); }
}
