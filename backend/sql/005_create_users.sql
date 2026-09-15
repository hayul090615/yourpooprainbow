CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  google_sub VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  name VARCHAR(200) NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_google_sub UNIQUE (google_sub),
  CONSTRAINT uq_users_email UNIQUE (email)
);

COMMENT ON COLUMN public.users.google_sub IS
  'Google ID token의 변경되지 않는 사용자 식별자(sub).';

COMMENT ON COLUMN public.users.profile_image IS
  'Google 계정 프로필 이미지 URL.';
