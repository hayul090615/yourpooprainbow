import { pool } from '../../backend/src/db/pool.js';
import { createSession, hashPassword, toAuthUser } from '../../backend/src/services/auth-service.js';

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void; setHeader(name: string, value: string): void; end(): void };

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === 'OPTIONS') { response.setHeader('Allow', 'POST, OPTIONS'); response.status(204).end(); return; }
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST, OPTIONS'); response.status(405).json({ message: 'POST 요청만 지원합니다.' }); return; }
  const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.nickname === 'string' ? body.nickname.trim() : '';
  if (!email.includes('@') || email.length > 320 || name.length < 2 || name.length > 200 || password.length < 8) {
    response.status(400).json({ message: '이메일, 2자 이상의 닉네임, 8자 이상의 비밀번호를 확인해 주세요.' }); return;
  }
  try {
    const result = await pool.query(`INSERT INTO public.users (google_sub, email, name, password_hash, role) VALUES (NULL, $1, $2, $3, 'user') RETURNING id, email, name, profile_image, role;`, [email, name, await hashPassword(password)]);
    const user = toAuthUser(result.rows[0]);
    response.status(201).json({ user, token: await createSession(user.id) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') { response.status(409).json({ message: '이미 가입된 이메일입니다.' }); return; }
    console.error('Failed to sign up:', error); response.status(500).json({ message: '회원가입을 처리하지 못했습니다.' });
  }
}
