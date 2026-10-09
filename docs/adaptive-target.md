# Adaptive calorie target

An opt-in way for the calorie target to follow what someone actually burns. It uses
their own log and weight trend instead of formulas or per-workout estimates. The code is
in [`energyBalance.ts`](../src/food/models/energyBalance.ts) (pure, tested) and
[`useAdaptiveTarget.ts`](../src/food/hooks/useAdaptiveTarget.ts).

## The estimate

Over a 21-day window ending yesterday:

> burn per day ≈ average logged calories − (change in trend weight × 3,500) ÷ 21

- **Trend weight** comes from `dailyTrend`: weigh-ins averaged per day, straight lines
  between them, then a roughly 10-day exponential average. It moves per day, unlike the
  chart's trend, which moves per weigh-in.
- **Logged calories** come only from fully logged days (`completeDays`). A fully logged day
  has food in two or more meals, or every core meal accounted for. Days with nothing logged
  are left out, never counted as eating nothing.
- **Learning:** the estimate waits until there are 14 fully logged days and 6 weigh-ins, at
  least 2 in each half of the window. Until then the card shows progress.
- **Range:** a likely range is shown with the estimate, based on how much daily intake
  varied.

Logging habits partly cancel out. If someone always under-logs a little, the burn comes out
a little low too, so the target still produces the change they're aiming for.

## The suggestion

`suggestTarget` works the suggestion out in this order:
1. **Aim:** the burn plus the aim's offset (lose −500, lose slowly −250, maintain 0,
   gain +250).
2. **Fastest loss:** never more than 1% of body weight a week.
3. **Floor:** never below 1,200.
4. **Weekly change:** never more than 100 away from the current target.
5. **Rounding:** to the nearest 50.

A suggestion is offered only when it differs from the target by 50 or more, at most once a
week (`lastSuggestionWeek` in settings). It appears on the Calories tab and on Today.
"Use" applies it, rescaling macro grams so the split holds. "Not now" waits until next
week. Nothing ever applies automatically.

## Guardrails

- **Off by default.** It needs both calories and weight tracked.
- **Movement stays calorie-free.** Exercise shows up in the estimate on its own, so logged
  workouts never add calories to the target (see [design.md](design.md)).
- **No new data.** It reads food entries, skipped meals and weigh-ins only.
- **Local mode always shows learning.** The in-memory food log keeps one day, so the
  estimate can't be shown there.

## Trends

The "Intake and burn" card (`EnergyTrendCard`) draws the estimate as it stood at the end of
each of the last 8 weeks, next to that week's average logged intake (`weeklyEnergy`). It's
shown only while the adaptive target is on.
