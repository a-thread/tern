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
   equivalent of banking steps for a treat.
3. **Rest days are first-class.** They hold the streak (don't increment it), earn
   waypoints, and render in driftwood — visually distinct from a missed day.
4. **Weight is shown as a trend with a visible fluctuation band.** Day-to-day deltas are
   deliberately de-emphasized because they're mostly water.
5. **Food color is information, not judgment.** It maps to NOVA processing level, always
   shows the number alongside the color (accessibility), is user-overridable, and can be
   switched off entirely in settings.

## Earning rules

A day is a goal day or a rest day, never both: reaching the goal after taking a rest day
returns that rest day to the week's allowance. Skipping a meal with "nothing today"
counts exactly as logging it, so a complete log never means eating more than you wanted.
Nothing about these rules rewards under-reporting, and there is no leaderboard — the only
person a padded ledger fools is the person keeping it.
