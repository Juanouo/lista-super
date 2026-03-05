-- Saved lists table
create table public.saved_lists (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  item_count int not null,
  items      jsonb not null  -- ActiveItem[]
);

create index saved_lists_created_at_idx on public.saved_lists (created_at desc);

alter table public.saved_lists enable row level security;
create policy "allow all for anon" on public.saved_lists
  for all to anon using (true) with check (true);

-- Master list table (single-row)
create table public.master_list (
  id         int primary key default 1,
  updated_at timestamptz not null default now(),
  sections   jsonb not null  -- ParsedList (Section[])
);
