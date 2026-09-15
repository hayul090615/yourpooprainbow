import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value.trim() === '') {
    throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다. .env 파일을 확인하세요.`);
  }

  return value;
}

function getPort(): number {
  const value = Number(getEnv('DB_PORT', '5432'));

  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('DB_PORT는 1부터 65535 사이의 정수여야 합니다.');
  }

  return value;
}

export const env = {
  db: {
    connectionString: databaseUrl,
    host: databaseUrl ? undefined : getEnv('DB_HOST', 'localhost'),
    port: databaseUrl ? undefined : getPort(),
    name: databaseUrl ? undefined : getEnv('DB_NAME', 'geuphaeyo'),
    user: databaseUrl ? undefined : getEnv('DB_USER', 'postgres'),
    password: databaseUrl ? undefined : process.env.DB_PASSWORD?.trim(),
    configured: Boolean(databaseUrl || process.env.DB_PASSWORD?.trim()),
    ssl: process.env.DB_SSL === 'true'
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? '',
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  kakaoRestApiKey: process.env.KAKAO_REST_API_KEY?.trim() ?? '',
  frontendOrigins: getEnv(
    'FRONTEND_ORIGINS',
    'http://localhost:5173,https://yourpooprainbow.vercel.app'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
} as const;
