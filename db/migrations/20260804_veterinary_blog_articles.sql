create table if not exists public.veterinary_blog_articles (
  id uuid primary key default extensions.uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  author_id uuid not null,
  title text not null,
  slug text unique,
  excerpt text,
  content text not null,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'rejected')),
  admin_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists veterinary_blog_articles_author_idx
  on public.veterinary_blog_articles(author_id, updated_at desc);

create index if not exists veterinary_blog_articles_review_idx
  on public.veterinary_blog_articles(status, submitted_at desc);

create index if not exists veterinary_blog_articles_public_idx
  on public.veterinary_blog_articles(published_at desc)
  where status = 'published';

