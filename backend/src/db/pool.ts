import { Pool, type PoolConfig } from 'pg';
import { env } from '../config/env';

const poolConfig: PoolConfig = {
  ...(env.db.connectionString
    ? { connectionString: env.db.connectionString }
    : {
        host: env.db.host,
        port: env.db.port,
        database: env.db.name,
        user: env.db.user,
        password: env.db.password,
      }),
  ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
};

export const pool = new Pool(poolConfig);

pool.on('error', (error) => {
  console.error('유휴 PostgreSQL 클라이언트에서 오류가 발생했습니다.', error);
});
