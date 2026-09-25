-- One-off pre-launch reset. Only safe before there are real users.
--
-- Two things changed in a way that old rows can't be read correctly against:
--
--   * The journey's stops were renamed and re-spaced, and now repeat for every
--     migration. A total earned under the old stops would show a different set
--     of milestones as reached.
--   * The goal weight became optional, and used to be seeded at 190 lb for
--     everyone. There's no way to tell a goal someone chose from that default,
--     so it goes, and anyone who wants one sets it in Settings.
--
-- Food, weigh-ins, saved meals, water, mood, medication and the rest of
-- settings are untouched.

delete from tern.waypoint_events;
delete from tern.rest_days;

update tern.settings
set data = data - 'weightGoalLb'
where data ? 'weightGoalLb';
