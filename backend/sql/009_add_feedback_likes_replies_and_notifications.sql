ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS admin_reply VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.feedback_likes (
  feedback_id BIGINT NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (feedback_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feedback_id BIGINT REFERENCES public.feedback(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_recipient_created_at
  ON public.user_notifications(recipient_user_id, created_at DESC);
