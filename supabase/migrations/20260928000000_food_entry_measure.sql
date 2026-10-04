-- How a logged amount was measured (eggs, cups, grams), so an entry can be
-- edited or logged again in the same unit. Stored as json: per-100 g nutrition,
-- the units on offer, and the unit and quantity chosen. Null for entries logged
-- before this, which keep working from their serving label.

alter table tern.food_entries
  add column measure jsonb
  check (measure is null or jsonb_typeof(measure) = 'object');
