-- More ways to earn waypoints, all still for behavior and never for a number:
--
--   * each meal logged (breakfast, lunch, dinner): 5 each, on top of the
--     "all meals" award
--   * taking all of the day's medication: 10
--   * logging a weigh-in: 5. For logging one, whatever it says.
--   * a streak milestone: a one-time bonus at 7, 14, 30, 60, 100, 200 and 365
--     days. The only source whose points vary, so the check lists them.
--
-- The sources and fixed points are the ones in `WaypointRules` and
-- `StreakBonuses` (src/journey/models/waypoint.ts); keep the two in step.

alter table tern.waypoint_events drop constraint if exists waypoint_events_source_check;
alter table tern.waypoint_events
  add constraint waypoint_events_source_check
  check (source in (
    'steps', 'meals', 'rest', 'water', 'mood',
    'weight', 'medication', 'breakfast', 'lunch', 'dinner', 'streak'
  ));

alter table tern.waypoint_events drop constraint if exists waypoint_events_points_check;
alter table tern.waypoint_events
  add constraint waypoint_events_points_check check (
    (source = 'steps' and points = 40)
    or (source = 'meals' and points = 15)
    or (source in ('rest', 'water', 'mood', 'medication') and points = 10)
    or (source in ('weight', 'breakfast', 'lunch', 'dinner') and points = 5)
    or (source = 'streak' and points in (25, 40, 75, 100, 150, 250, 500))
  );
