import { env } from '../config/env';
import { pool } from '../db/pool';
import { hashPassword } from '../services/auth-service';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = process.env.ADMIN_NAME?.trim() || '관리자';

  if (!email || !email.includes('@')) throw new Error('ADMIN_EMAIL을 올바르게 설정해 주세요.');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD는 12자 이상이어야 합니다.');
  if (!env.db.configured) throw new Error('PostgreSQL 연결 환경변수를 먼저 설정해 주세요.');

  const passwordHash = await hashPassword(password);
  const result = await pool.query<{ id: string; email: string }>(
    `INSERT INTO public.users (google_sub, email, name, password_hash, role)
     VALUES (NULL, $1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = 'admin',
           updated_at = CURRENT_TIMESTAMP
     RETURNING id, email;`,
    [email, name, passwordHash],
  );
  console.log(`관리자 계정이 준비되었습니다: ${result.rows[0].email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
