CREATE TABLE IF NOT EXISTS public.clinic_description_history (
  id bigserial PRIMARY KEY,
  clinic_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  previous_description text,
  replacement_description text,
  source text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clinic_description_history_batch_clinic_uidx
  ON public.clinic_description_history (batch_id, clinic_id);

CREATE INDEX IF NOT EXISTS clinic_description_history_clinic_created_idx
  ON public.clinic_description_history (clinic_id, created_at DESC);

COMMENT ON TABLE public.clinic_description_history IS
  'Storico append-only delle descrizioni delle cliniche prima di ripristini o rigenerazioni AI.';
