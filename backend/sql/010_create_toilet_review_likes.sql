CREATE TABLE IF NOT EXISTS public.toilet_review_likes (
  review_id BIGINT NOT NULL REFERENCES public.toilet_reviews(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id)
);
