-- An optional note on a meal check-in: a few words about the meal, up to 280
-- characters. Null when nothing was written; checking in again without one
-- clears it.

alter table tern.meal_checkins
  add column note text check (note is null or char_length(note) <= 280);
