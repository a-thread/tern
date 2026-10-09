# Design

## The palette rule

`coral (#D8431F)` is the **primary action color only** — the way the bill is one small
bright mark on a mostly-white bird. Every other domain has its own hue:

| Domain                | Color                                 |
| --------------------- | ------------------------------------- |
| Steps, movement       | glacier `#5FA8B8`                     |
| Weight, trends        | deep water `#3E5A6C`                  |
| Journey, milestones   | aurora `#4E8C7D` + twilight `#6B5B9A` |
| Streaks, goal moments | midnight sun `#E0A32E`                |
| Whole foods           | kelp `#5C6B4E`                        |
| Rest days             | driftwood `#5B4636`                   |

If you find yourself reaching for coral to make something stand out, reach for the
domain color instead. The tokens live in
[`src/shared/theme/index.ts`](../src/shared/theme/index.ts).

## Design commitments

These are deliberate and worth preserving as the app grows:

1. **Rewards are for behavior, never outcomes.** Waypoints come from logging, moving,
   and resting. Nothing pays out for a number on the scale or staying under a calorie
   target.
2. **No compensatory mechanics.** Exercise never "earns back" food. There is no
   equivalent of banking steps for a treat. Movement is logged in minutes, never as
   calories burned.
6. **The calorie target can learn, from your own data.** With the adaptive target on,
   Tern estimates what you actually burn from what you log and how your trend weight
   moves, so all activity counts without per-workout estimates. It only ever suggests a
   new target, at most once a week and by at most 100 calories; nothing changes until
   you choose it. See [adaptive-target.md](adaptive-target.md).
3. **Rest days are first-class.** They hold the streak (don't increment it), earn
   waypoints, and render in driftwood — visually distinct from a missed day. A streak
   freeze does the same job for a day a rest day couldn't cover, and renders in blue.
4. **Weight is shown as a trend with a visible fluctuation band.** Day-to-day deltas are
   deliberately de-emphasized because they're mostly water.
5. **Food color is information, not judgment.** It maps to NOVA processing level, always
   shows the number alongside the color (accessibility), is user-overridable, and can be
   switched off entirely in settings.

## Earning rules

A day is a goal day or a rest day, never both: reaching the goal (by steps or by movement)
after taking a rest day returns that rest day to the week's allowance. A day counts as a
goal day once, however it got there. Skipping a meal with "nothing today"
counts exactly as logging it, so a complete log never means eating more than you wanted.
Nothing about these rules rewards under-reporting, and there is no leaderboard — the only
person a padded ledger fools is the person keeping it.

### What earns waypoints

Every rule is for something done, never for a number. The amounts live in
[`WaypointRules`](../src/journey/models/waypoint.ts), and the database check in the newest
`waypoint_events_points_check` migration has to agree with them (a test compares the two).

| Source | Waypoints | For |
| --- | --- | --- |
| Goal day | 40 | reaching the step goal, or the movement goal (30 minutes unless changed) of activity steps can't see: swims, rides, lifting, yoga, classes. Walks and runs are already in the steps |
| Movement | 10 | logging any movement today |
| All meals | 15 | every core meal logged or marked "nothing today" |
| Each meal | 5 each | food logged in breakfast, lunch and dinner. A skipped meal doesn't pay this one |
| Rest day | 10 | taking one (a goal day is never also a rest day) |
| Water, mood | 10 each | reaching the water goal, checking in |
| Medication | 10 | every dose due today taken |
| Weigh-in | 5 | logging one, whatever it says |
| Streak milestone | 25 – 500 | once, on the day a streak reaches 7, 14, 30, 60, 100, 200 and 365 days |

### Streak freezes

A streak freeze covers one day that would otherwise break a streak. Rest days still come
first: a day under the goal that a rest day holds never uses one. A freeze is earned each
time a streak reaches a multiple of 7 days, up to two held, and is used automatically for
the next day that would break it. A frozen day holds the streak without adding to it, and
shows in blue.

Freezes aren't stored. They're worked out by replaying the day record
([`withFreezes`](../src/today/models/dayRecord.ts)), so the same history always gives the same
answer and changing a goal or a rest day stays consistent. Earning one costs nothing, and
nothing buys one, so there's no way to spend points to protect a streak.
