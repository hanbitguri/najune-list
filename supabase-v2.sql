-- 나주네 리스트 v2: per-item sync (additive; the old public.spaces table is kept untouched).
-- Run once in Supabase Dashboard → SQL Editor. Safe to re-run.
-- One row per place / trip / category, scoped by space_id. Deletes are soft (deleted=true),
-- so no DELETE policy is needed. The app migrates an existing `spaces` row automatically
-- the first time a space is opened after this is installed.

create table if not exists public.items (
  space_id   text not null check (char_length(space_id) between 3 and 64),
  kind       text not null check (kind in ('place','trip','category')),
  id         text not null check (char_length(id) between 1 and 64),
  data       jsonb not null default '{}'::jsonb,
  deleted    boolean not null default false,
  client_id  text,
  updated_at timestamptz not null default now(),
  primary key (space_id, kind, id)
);
create index if not exists items_space_idx on public.items (space_id);

alter table public.items replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.items;
exception when duplicate_object then null; end $$;

-- RLS. PROTOTYPE ONLY (same model as v1): anyone with the anon key and a space code can
-- read/write that space's items. The space code is the only "secret".
alter table public.items enable row level security;
drop policy if exists "anon read items"   on public.items;
drop policy if exists "anon insert items" on public.items;
drop policy if exists "anon update items" on public.items;
create policy "anon read items"   on public.items for select to anon, authenticated using (true);
create policy "anon insert items" on public.items for insert to anon, authenticated with check (char_length(space_id) >= 3);
create policy "anon update items" on public.items for update to anon, authenticated using (true) with check (true);
grant select, insert, update on public.items to anon, authenticated;
