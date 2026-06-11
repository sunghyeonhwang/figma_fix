create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.figma_comment_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  figma_file_key text not null,
  figma_file_name text not null,
  figma_url text,
  figma_node_id text,
  total_count integer not null default 0,
  resolved_count integer not null default 0,
  unresolved_count integer not null default 0,
  category_counts jsonb not null default '{}'::jsonb,
  raw_comments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.markdown_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid references public.figma_comment_runs(id) on delete set null,
  category text,
  include_resolved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.figma_comment_runs enable row level security;
alter table public.markdown_exports enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "figma_comment_runs_select_own"
  on public.figma_comment_runs for select
  using (auth.uid() = user_id);

create policy "figma_comment_runs_insert_own"
  on public.figma_comment_runs for insert
  with check (auth.uid() = user_id);

create policy "figma_comment_runs_delete_own"
  on public.figma_comment_runs for delete
  using (auth.uid() = user_id);

create policy "markdown_exports_select_own"
  on public.markdown_exports for select
  using (auth.uid() = user_id);

create policy "markdown_exports_insert_own"
  on public.markdown_exports for insert
  with check (auth.uid() = user_id);
