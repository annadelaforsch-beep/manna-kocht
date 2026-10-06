-- Basics zuhause (Salz, Öl, Gewürze …): werden nicht auf die Einkaufsliste gesetzt.
-- Einmalig im Supabase SQL Editor ausführen.

create table if not exists pantry_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- keine Dubletten (Groß-/Kleinschreibung egal)
create unique index if not exists pantry_items_name_key on pantry_items (lower(name));

alter table pantry_items enable row level security;

create policy "pantry_items_anon_all" on pantry_items
  for all to anon using (true) with check (true);

insert into pantry_items (name) values
  ('Salz'), ('Pfeffer'), ('Öl'), ('Essig'), ('Paprikapulver'), ('Oregano'),
  ('Zimt'), ('Kurkuma'), ('Kreuzkümmel'), ('Curry'), ('Muskat')
on conflict do nothing;
