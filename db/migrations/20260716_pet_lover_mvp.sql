create table if not exists public.pet_profiles (
  id uuid primary key default extensions.uuid_generate_v4(),
  owner_id uuid not null references public.local_auth_users(id) on delete cascade,
  name text not null,
  species text not null default 'cane',
  breed text,
  sex text,
  birth_date date,
  weight_kg numeric(6,2),
  photo_url text,
  microchip text,
  neutered boolean,
  allergies text,
  conditions text,
  medications text,
  nutrition_notes text,
  behavior_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pet_profiles_owner_idx
  on public.pet_profiles (owner_id, created_at desc);

create table if not exists public.pet_health_reminders (
  id uuid primary key default extensions.uuid_generate_v4(),
  owner_id uuid not null references public.local_auth_users(id) on delete cascade,
  pet_id uuid not null references public.pet_profiles(id) on delete cascade,
  reminder_type text not null default 'altro',
  title text not null,
  due_date date not null,
  repeat_rule text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pet_health_reminders_owner_due_idx
  on public.pet_health_reminders (owner_id, due_date asc);

create table if not exists public.pet_expenses (
  id uuid primary key default extensions.uuid_generate_v4(),
  owner_id uuid not null references public.local_auth_users(id) on delete cascade,
  pet_id uuid references public.pet_profiles(id) on delete set null,
  spent_on date not null,
  amount numeric(10,2) not null default 0,
  category text not null default 'visita',
  vendor text,
  document_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pet_expenses_owner_spent_idx
  on public.pet_expenses (owner_id, spent_on desc);

create table if not exists public.pet_owner_fiscal_profiles (
  owner_id uuid primary key references public.local_auth_users(id) on delete cascade,
  fiscal_code text,
  billing_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_share_links (
  id uuid primary key default extensions.uuid_generate_v4(),
  token text not null unique,
  owner_id uuid not null references public.local_auth_users(id) on delete cascade,
  pet_id uuid not null references public.pet_profiles(id) on delete cascade,
  scopes text[] not null default array['base']::text[],
  expires_at timestamptz not null default now() + interval '14 days',
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_viewed_at timestamptz
);

create index if not exists pet_share_links_owner_idx
  on public.pet_share_links (owner_id, created_at desc);

create index if not exists pet_share_links_token_idx
  on public.pet_share_links (token);
