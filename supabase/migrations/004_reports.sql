-- Reports table for user-flagged comments. One row per (comment, reporter)
-- so the same user can't pile up reports on the same comment, but multiple
-- reporters add weight to a single comment.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create index if not exists reports_comment_id_idx on public.reports (comment_id);
create index if not exists reports_created_at_idx on public.reports (created_at desc);

alter table public.reports enable row level security;

-- Anyone authenticated can submit; nobody but the service role can read.
drop policy if exists reports_insert on public.reports;
create policy reports_insert
  on public.reports
  for insert
  with check (true);
