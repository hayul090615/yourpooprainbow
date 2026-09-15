ALTER TABLE public.feedback
  DROP CONSTRAINT IF EXISTS ck_feedback_type;

ALTER TABLE public.feedback
  ADD CONSTRAINT ck_feedback_type
  CHECK (type IN ('bug', 'suggestion', 'toilet_update'));
