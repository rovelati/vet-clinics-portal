create table if not exists public.clinic_lead_events (
  id uuid primary key default extensions.uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  event_type text not null,
  source text,
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  service_slug text,
  service_name text,
  location_label text,
  page_path text,
  link_url text,
  visitor_hash text,
  requester_email text,
  requester_phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists clinic_lead_events_clinic_created_idx
  on public.clinic_lead_events (clinic_id, created_at desc);

create index if not exists clinic_lead_events_type_created_idx
  on public.clinic_lead_events (event_type, created_at desc);

create table if not exists public.clinic_marketing_outreach (
  id uuid primary key default extensions.uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  campaign_key text not null,
  recipient_email text not null,
  subject text not null,
  status text not null default 'pending',
  click_token uuid not null default extensions.uuid_generate_v4(),
  lead_event_ids uuid[] not null default '{}'::uuid[],
  lead_summary jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  clicked_at timestamptz,
  last_click_target text,
  registered_user_id uuid,
  registered_at timestamptz,
  claimed_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clinic_marketing_outreach_click_token_idx
  on public.clinic_marketing_outreach (click_token);

create index if not exists clinic_marketing_outreach_clinic_campaign_idx
  on public.clinic_marketing_outreach (clinic_id, campaign_key, created_at desc);

create index if not exists clinic_marketing_outreach_status_created_idx
  on public.clinic_marketing_outreach (status, created_at desc);
