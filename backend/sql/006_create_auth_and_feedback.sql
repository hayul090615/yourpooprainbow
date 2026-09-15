ALTER TABLE public.users
  ALTER COLUMN google_sub DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS ck_users_role;

ALTER TABLE public.users
  ADD CONSTRAINT ck_users_role CHECK (role IN ('user', 'admin'));

CREATE TABLE IF NOT EXISTS public.auth_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
  ON public.auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at
  ON public.auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS public.feedback (
  id BIGSERIAL PRIMARY KEY,
  sender_user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  area VARCHAR(20) NOT NULL,
  title VARCHAR(80) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'received',
  admin_note VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_feedback_type CHECK (type IN ('bug', 'suggestion', 'toilet_update')),
  CONSTRAINT ck_feedback_area CHECK (area IN ('map', 'service', 'auth', 'other')),
  CONSTRAINT ck_feedback_status CHECK (status IN ('received', 'reviewing', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at
  ON public.feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_status
  ON public.feedback(status);
