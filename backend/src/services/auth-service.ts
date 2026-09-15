import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { RequestHandler } from 'express';
import { pool } from '../db/pool';

const scrypt = promisify(scryptCallback);
const sessionDurationMs = 1000 * 60 * 60 * 24 * 7;

export type UserRole = 'user' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
  role: UserRole;
};

export function toAuthUser(row: {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  role: UserRole;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    profileImage: row.profile_image,
    role: row.role,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltHex, keyHex] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;

  try {
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await pool.query(
    `INSERT INTO public.auth_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3);`,
    [hashToken(token), userId, new Date(Date.now() + sessionDurationMs)],
  );
  return token;
}

export async function findSessionUser(authorization: string | undefined): Promise<AuthUser | null> {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const result = await pool.query<{
    id: string;
    email: string;
    name: string;
    profile_image: string | null;
    role: UserRole;
  }>(
    `SELECT users.id, users.email, users.name, users.profile_image, users.role
     FROM public.auth_sessions
     JOIN public.users ON users.id = auth_sessions.user_id
     WHERE auth_sessions.token_hash = $1
       AND auth_sessions.expires_at > CURRENT_TIMESTAMP;`,
    [hashToken(match[1])],
  );
  return result.rows[0] ? toAuthUser(result.rows[0]) : null;
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    const user = await findSessionUser(request.headers.authorization);
    if (!user) {
      response.status(401).json({ message: '로그인이 필요합니다.' });
      return;
    }
    response.locals.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin: RequestHandler = async (request, response, next) => {
  try {
    const user = await findSessionUser(request.headers.authorization);
    if (!user) {
      response.status(401).json({ message: '로그인이 필요합니다.' });
      return;
    }
    if (user.role !== 'admin') {
      response.status(403).json({ message: '관리자 권한이 필요합니다.' });
      return;
    }
    response.locals.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
