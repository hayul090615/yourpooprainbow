CREATE TABLE IF NOT EXISTS public.toilet_reviews (
  id BIGSERIAL PRIMARY KEY,
  toilet_id VARCHAR(200) NOT NULL,
  toilet_name VARCHAR(200) NOT NULL,
  author_user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  cleanliness SMALLINT NOT NULL CHECK (cleanliness BETWEEN 1 AND 5),
  content VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_toilet_reviews_author_toilet UNIQUE (author_user_id, toilet_id)
);

CREATE INDEX IF NOT EXISTS idx_toilet_reviews_toilet_id_created_at
  ON public.toilet_reviews(toilet_id, created_at DESC);
