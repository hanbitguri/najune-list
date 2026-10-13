-- 나주네 리스트: Supabase schema (prototype)
-- One row per shared "space"; the whole list (places + trips) lives in a jsonb column.
-- Run this once in Supabase Dashboard → SQL Editor.

create table if not exists public.spaces (
  id          text primary key check (char_length(id) between 3 and 64),
  data        jsonb not null default '{"places":[],"trips":[]}'::jsonb,
  client_id   text,                       -- which device wrote last (used to ignore own echoes)
  updated_at  timestamptz not null default now()
);

-- Realtime: broadcast row changes
alter table public.spaces replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.spaces;
exception when duplicate_object then null; end $$;

-- RLS. PROTOTYPE ONLY: anyone holding the anon key AND a space code can read/write that space.
-- The space code acts as a shared secret, so pick a hard-to-guess one. Clients always
-- filter by id, but RLS cannot verify the code without auth; for real privacy, add
-- Supabase Auth and a members table, then scope policies with auth.uid().
alter table public.spaces enable row level security;

drop policy if exists "anon read spaces"   on public.spaces;
drop policy if exists "anon insert spaces" on public.spaces;
drop policy if exists "anon update spaces" on public.spaces;

create policy "anon read spaces"   on public.spaces for select to anon, authenticated using (true);
create policy "anon insert spaces" on public.spaces for insert to anon, authenticated with check (char_length(id) >= 3);
create policy "anon update spaces" on public.spaces for update to anon, authenticated using (true) with check (true);
-- No delete policy: rows cannot be deleted from the client.

grant select, insert, update on public.spaces to anon, authenticated;
