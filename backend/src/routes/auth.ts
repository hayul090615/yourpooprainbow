import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { pool } from '../db/pool';
import {
  authenticateGoogleUser,
  GoogleAuthError,
} from '../services/google-auth-service';
import {
  createSession,
  hashPassword,
  verifyPassword,
  type UserRole,
} from '../services/auth-service';

type UserRow = {
  id: string;
  google_sub: string;
  email: string;
  name: string;
  profile_image: string | null;
  created_at: Date;
  updated_at: Date;
  password_hash: string | null;
  role: UserRole;
};

const googleClient = new OAuth2Client();

export const authRouter = Router();

function toResponseUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    profileImage: row.profile_image,
    role: row.role,
  };
}

function readCredentials(body: unknown) {
  const input = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  return {
    email: typeof input.email === 'string' ? input.email.trim().toLowerCase() : '',
    password: typeof input.password === 'string' ? input.password : '',
    name: typeof input.nickname === 'string' ? input.nickname.trim() : '',
  };
}

authRouter.post('/signup', async (request, response) => {
  const { email, password, name } = readCredentials(request.body);
  if (!email.includes('@') || email.length > 320 || name.length < 2 || name.length > 200 || password.length < 8) {
    response.status(400).json({ message: '이메일, 2자 이상의 닉네임, 8자 이상의 비밀번호를 확인해 주세요.' });
    return;
  }

  try {
    const result = await pool.query<UserRow>(
      `INSERT INTO public.users (google_sub, email, name, password_hash, role)
       VALUES (NULL, $1, $2, $3, 'user')
       RETURNING *;`,
      [email, name, await hashPassword(password)],
    );
    const user = toResponseUser(result.rows[0]);
    response.status(201).json({ user, token: await createSession(user.id) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      response.status(409).json({ message: '이미 가입된 이메일입니다.' });
      return;
    }
    console.error('Failed to sign up:', error);
    response.status(500).json({ message: '회원가입을 처리하지 못했습니다.' });
  }
});

authRouter.post('/login', async (request, response) => {
  const { email, password } = readCredentials(request.body);
  if (!email || !password) {
    response.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
    return;
  }

  try {
    const result = await pool.query<UserRow>('SELECT * FROM public.users WHERE email = $1;', [email]);
    const row = result.rows[0];
    if (!row?.password_hash || !(await verifyPassword(password, row.password_hash))) {
      response.status(401).json({ message: '이메일 또는 비밀번호를 확인해 주세요.' });
      return;
    }
    const user = toResponseUser(row);
    response.json({ user, token: await createSession(user.id) });
  } catch (error) {
    console.error('Failed to sign in:', error);
    response.status(500).json({ message: '로그인을 처리하지 못했습니다.' });
  }
});

authRouter.post('/google', async (request, response) => {
  if (!env.googleClientId) {
    response.status(503).json({ message: 'Google 로그인이 서버에 설정되지 않았습니다.' });
    return;
  }

  const idToken =
    typeof request.body === 'object' &&
    request.body !== null &&
    typeof request.body.idToken === 'string'
      ? request.body.idToken.trim()
      : '';

  if (!idToken) {
    response.status(400).json({ message: 'Google ID token이 필요합니다.' });
    return;
  }

  try {
    const user = await authenticateGoogleUser(idToken);
    response.json({ user, token: await createSession(user.id) });
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      response.status(error.status).json({ message: error.message });
      return;
    }
    console.error('Unexpected Google login error:', error);
    response.status(500).json({ message: 'Google 로그인 처리 중 오류가 발생했습니다.' });
  }
  return;

  /*
  let googleUser: {
    sub: string;
    email: string;
    name: string;
    profileImage: string | null;
  };

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();

    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      response.status(401).json({ message: '검증된 Google 계정 정보를 확인할 수 없습니다.' });
      return;
    }

    const email = payload.email.trim().toLowerCase();
    googleUser = {
      sub: payload.sub,
      email,
      name: payload.name?.trim() || email.split('@')[0],
      profileImage: payload.picture?.trim() || null,
    };
  } catch {
    console.warn('Google ID token verification failed.');
    response.status(401).json({ message: '유효하지 않거나 만료된 Google 로그인 정보입니다.' });
    return;
  }

  const client = await pool.connect().catch((error) => {
    console.error('Failed to connect to PostgreSQL for Google login:', error);
    return null;
  });

  if (!client) {
    response.status(503).json({ message: '사용자 데이터베이스에 연결하지 못했습니다.' });
    return;
  }

  try {
    await client.query('BEGIN');

    const existingResult = await client.query<UserRow>(
      `SELECT *
       FROM public.users
       WHERE google_sub = $1 OR email = $2
       FOR UPDATE;`,
      [googleUser.sub, googleUser.email],
    );
    const existingUser = existingResult.rows.find(
      (user) => user.google_sub === googleUser.sub,
    );

    if (existingResult.rows.some((user) => user.google_sub !== googleUser.sub)) {
      await client.query('ROLLBACK');
      response.status(409).json({ message: '이미 다른 Google 계정에 연결된 이메일입니다.' });
      return;
    }

    const savedResult = existingUser
      ? await client.query<UserRow>(
          `UPDATE public.users
           SET email = $1,
               name = $2,
               profile_image = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *;`,
          [googleUser.email, googleUser.name, googleUser.profileImage, existingUser.id],
        )
      : await client.query<UserRow>(
          `INSERT INTO public.users (google_sub, email, name, profile_image)
           VALUES ($1, $2, $3, $4)
           RETURNING *;`,
          [googleUser.sub, googleUser.email, googleUser.name, googleUser.profileImage],
        );

    await client.query('COMMIT');
    response.json({ user: toResponseUser(savedResult.rows[0]) });
  } catch (error) {
    await client.query('ROLLBACK');

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      response.status(409).json({ message: '이미 등록된 Google 계정 또는 이메일입니다.' });
      return;
    }

    console.error('Failed to save Google user:', error);
    response.status(500).json({ message: '사용자 정보를 저장하지 못했습니다.' });
  } finally {
    client.release();
  }
  */
});
