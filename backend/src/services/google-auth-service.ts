import { OAuth2Client } from 'google-auth-library';
import type { PoolClient } from 'pg';
import { env } from '../config/env';
import { pool } from '../db/pool';
import type { UserRole } from './auth-service';

type UserRow = {
  id: string;
  google_sub: string | null;
  email: string;
  name: string;
  profile_image: string | null;
  role: UserRole;
};

export type AuthenticatedGoogleUser = {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
  role: UserRole;
};

export class GoogleAuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

const googleClient = new OAuth2Client();

export async function authenticateGoogleUser(
  idToken: string,
): Promise<AuthenticatedGoogleUser> {
  if (!env.googleClientId) {
    throw new GoogleAuthError(503, 'Google 로그인이 서버에 설정되지 않았습니다.');
  }
  if (!env.db.configured) {
    throw new GoogleAuthError(503, '운영 PostgreSQL 연결이 설정되지 않았습니다.');
  }

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

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new GoogleAuthError(401, '검증된 Google 계정 정보를 확인할 수 없습니다.');
    }

    const email = payload.email.trim().toLowerCase();
    googleUser = {
      sub: payload.sub,
      email,
      name: payload.name?.trim() || email.split('@')[0],
      profileImage: payload.picture?.trim() || null,
    };
  } catch (error) {
    if (error instanceof GoogleAuthError) throw error;
    console.warn('Google ID token verification failed.');
    throw new GoogleAuthError(401, '유효하지 않거나 만료된 Google 로그인 정보입니다.');
  }

  const client: PoolClient | null = await pool.connect().catch((error) => {
    console.error('Failed to connect to PostgreSQL for Google login:', error);
    return null;
  });

  if (!client) {
    throw new GoogleAuthError(503, '사용자 데이터베이스에 연결하지 못했습니다.');
  }

  try {
    await client.query('BEGIN');
    const existingResult = await client.query<UserRow>(
      `SELECT id, google_sub, email, name, profile_image, role
       FROM public.users
       WHERE google_sub = $1 OR email = $2
       FOR UPDATE;`,
      [googleUser.sub, googleUser.email],
    );
    const existingUser = existingResult.rows.find(
      (user) => user.google_sub === googleUser.sub || (user.email === googleUser.email && user.google_sub === null),
    );

    if (!existingUser && existingResult.rows.length > 0) {
      throw new GoogleAuthError(409, '이미 다른 Google 계정에 연결된 이메일입니다.');
    }

    const adminRole: UserRole = env.adminEmails.includes(googleUser.email) ? 'admin' : 'user';

    const savedResult = existingUser
      ? await client.query<UserRow>(
          `UPDATE public.users
           SET google_sub = $1,
               email = $2,
               name = $3,
               profile_image = $4,
               role = CASE WHEN role = 'admin' OR $5 = 'admin' THEN 'admin' ELSE 'user' END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6
           RETURNING id, google_sub, email, name, profile_image, role;`,
          [googleUser.sub, googleUser.email, googleUser.name, googleUser.profileImage, adminRole, existingUser.id],
        )
      : await client.query<UserRow>(
          `INSERT INTO public.users (google_sub, email, name, profile_image, role)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, google_sub, email, name, profile_image, role;`,
          [googleUser.sub, googleUser.email, googleUser.name, googleUser.profileImage, adminRole],
        );

    await client.query('COMMIT');
    const savedUser = savedResult.rows[0];
    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      profileImage: savedUser.profile_image,
      role: savedUser.role,
    };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof GoogleAuthError) throw error;
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new GoogleAuthError(409, '이미 등록된 Google 계정 또는 이메일입니다.');
    }

    console.error('Failed to save Google user:', error);
    throw new GoogleAuthError(500, '사용자 정보를 저장하지 못했습니다.');
  } finally {
    client.release();
  }
}
