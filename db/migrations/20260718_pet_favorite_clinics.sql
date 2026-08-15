create table if not exists public.pet_favorite_clinics (
  id uuid primary key default extensions.uuid_generate_v4(),
  owner_id uuid not null references public.local_auth_users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, clinic_id)
);

create index if not exists pet_favorite_clinics_owner_idx
  on public.pet_favorite_clinics (owner_id, created_at desc);

create index if not exists pet_favorite_clinics_clinic_idx
  on public.pet_favorite_clinics (clinic_id);
