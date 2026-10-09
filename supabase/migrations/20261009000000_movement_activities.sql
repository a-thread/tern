-- The list of activities lives in the app (`Activity` in
-- src/movement/models/movementEntry.ts), so adding one needs no migration. The
-- database only checks that an id looks like one: lowercase letters and
-- underscores. An id the app doesn't know reads back as "Other".
--
-- Also adds an optional distance for walks, runs, rides and hikes, stored in
-- meters (miles or kilometers are a display choice).

alter table tern.movement_entries
drop constraint if exists movement_entries_activity_check;

-- 'class' left the app's list: anything saved as a class reads as aerobics.
update tern.movement_entries set activity = 'aerobics' where activity = 'class';

alter table tern.movement_entries
add constraint movement_entries_activity_check check (activity ~ '^[a-z_]{1,32}$');

alter table tern.movement_entries
add column distance_m integer check (distance_m between 1 and 300000);
