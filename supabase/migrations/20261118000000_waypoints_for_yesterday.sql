-- Filling in yesterday earns yesterday's waypoints. Yesterday is at most
-- two UTC days back, so the ledger moves from require_recent_day (today only) to
-- require_today_or_yesterday, the check food, movement and day notes already use. Points
-- still have to match their source (waypoint_events_points_check), and rest days stay
-- today only.
drop trigger if exists waypoint_events_recent_day on tern.waypoint_events;


create trigger waypoint_events_recent_day before
insert
  or
update on tern.waypoint_events for each row
execute function tern.require_today_or_yesterday ();