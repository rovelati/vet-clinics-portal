create table if not exists public.quote_funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  service_slug text,
  service_name text,
  location_label text,
  page_path text,
  visitor_hash text,
  selected_clinic_count integer,
  selected_clinic_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quote_funnel_events_type_created_idx
  on public.quote_funnel_events (event_type, created_at desc);

create index if not exists quote_funnel_events_service_created_idx
  on public.quote_funnel_events (service_slug, created_at desc);
