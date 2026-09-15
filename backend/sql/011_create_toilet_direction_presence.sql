CREATE TABLE IF NOT EXISTS public.toilet_direction_presence (
  toilet_id VARCHAR(255) NOT NULL,
  visitor_id VARCHAR(128) NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (toilet_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_toilet_direction_presence_last_seen
  ON public.toilet_direction_presence (last_seen_at);
