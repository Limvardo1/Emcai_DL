-- ResumeAI — skema Supabase (PostgreSQL)
-- Jalankan di Supabase SQL Editor secara berurutan.

-- ---------------------------------------------------------------------------
-- 1. PROFILES (mirror auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: baca milik sendiri" on public.profiles;
drop policy if exists "profiles: ubah milik sendiri" on public.profiles;

create policy "profiles: baca milik sendiri"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: ubah milik sendiri"
  on public.profiles for update
  using (auth.uid() = id);

-- Buat profil otomatis saat user mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. RESUMES
-- ---------------------------------------------------------------------------
create table if not exists public.resumes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  file_name     text not null,
  file_path     text not null,
  file_size     integer,
  mime_type     text,
  extracted_text text,
  created_at    timestamptz not null default now()
);

create index if not exists resumes_user_created_idx
  on public.resumes (user_id, created_at desc);

alter table public.resumes enable row level security;

drop policy if exists "resumes: baca milik sendiri" on public.resumes;
drop policy if exists "resumes: tambah milik sendiri" on public.resumes;
drop policy if exists "resumes: hapus milik sendiri" on public.resumes;

create policy "resumes: baca milik sendiri"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "resumes: tambah milik sendiri"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "resumes: hapus milik sendiri"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. ANALYSIS_RESULTS
-- ---------------------------------------------------------------------------
create table if not exists public.analysis_results (
  id                  uuid primary key default gen_random_uuid(),
  resume_id           uuid not null references public.resumes (id) on delete cascade,
  user_id             uuid not null references auth.users (id) on delete cascade,
  overall_score       integer not null check (overall_score between 0 and 100),
  grade               text,
  predicted_role      text,
  predicted_category  text,
  family_key          text,
  family_label        text,
  confidence          numeric(6, 4),
  is_low_confidence   boolean not null default false,
  breakdown           jsonb not null default '{}'::jsonb,
  career_matches      jsonb not null default '[]'::jsonb,
  skill_gap           jsonb not null default '{}'::jsonb,
  strengths           text[] not null default '{}',
  weaknesses          text[] not null default '{}',
  suggestions         text[] not null default '{}',
  skills_detected     text[] not null default '{}',
  raw_predictions     jsonb not null default '[]'::jsonb,
  meta                jsonb not null default '{}'::jsonb,
  model_version       text,
  created_at          timestamptz not null default now()
);

-- Rekomendasi 3 profesi (jabatan konkret). Ditambahkan belakangan agar
-- project lama ikut terisi tanpa perlu drop table.
alter table public.analysis_results
  add column if not exists job_matches jsonb not null default '[]'::jsonb;

create index if not exists analysis_resume_idx
  on public.analysis_results (resume_id, created_at desc);

create index if not exists analysis_user_idx
  on public.analysis_results (user_id, created_at desc);

alter table public.analysis_results enable row level security;

drop policy if exists "analysis: baca milik sendiri" on public.analysis_results;
drop policy if exists "analysis: tambah milik sendiri" on public.analysis_results;
drop policy if exists "analysis: hapus milik sendiri" on public.analysis_results;

create policy "analysis: baca milik sendiri"
  on public.analysis_results for select
  using (auth.uid() = user_id);

create policy "analysis: tambah milik sendiri"
  on public.analysis_results for insert
  with check (auth.uid() = user_id);

create policy "analysis: hapus milik sendiri"
  on public.analysis_results for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. STORAGE BUCKET (privat)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "storage: unggah ke folder sendiri" on storage.objects;
drop policy if exists "storage: baca folder sendiri" on storage.objects;
drop policy if exists "storage: hapus file sendiri" on storage.objects;

create policy "storage: unggah ke folder sendiri"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage: baca folder sendiri"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage: hapus file sendiri"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
