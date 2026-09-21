-- Medication tracking: which medications were taken on which day. The
-- medications themselves (name, due time, reminder) live in the settings
-- document; this table only records "taken". One row per user, medication and
-- day, so marking a dose twice is harmless and un-marking deletes the row.

create table tern.medication_doses (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  medication_id text not null check (char_length(medication_id) between 1 and 64),
  day           date not null,
  taken_at      timestamptz not null default now(),
  primary key (user_id, medication_id, day)
);

alter table tern.medication_doses enable row level security;

create policy "own medication doses" on tern.medication_doses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.medication_doses to authenticated;
