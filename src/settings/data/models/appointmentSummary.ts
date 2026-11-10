import { addDays, formatLongDate, formatShortDate } from '@shared/utils/date';
import { formatWeight, type Units } from '@shared/utils/units';
import type { TernExport } from '@/domain/settings/models/ternExport';
import { Meals } from '@/domain/food/models/meals';
import {
  MealCheckInMetric,
  mealScoreWord,
} from '@/domain/meal-check-ins/models/mealCheckIn';
import {
  MoodMetric,
  MoodScale,
  scoreWord,
} from '@/domain/mood/models/moodEntry';

/** How far back a summary for an appointment reaches. */
export enum SummarySpan {
  TwoWeeks = 14,
  FourWeeks = 28,
}

/** What the summary may show: the person's own display choices, so nothing hidden reappears. */
export type SummaryChoices = {
  trackFood: boolean;
  /** Calories appear only when they're both tracked and shown. */
  trackCalories: boolean;
  showCalories: boolean;
  trackWeight: boolean;
  trackMood: boolean;
  trackMovement: boolean;
  units: Units;
};

type Row = Record<string, unknown>;

const str = (r: Row, key: string) =>
  typeof r[key] === 'string' ? (r[key] as string) : null;
const num = (r: Row, key: string) =>
  typeof r[key] === 'number' ? (r[key] as number) : null;

const MEAL_NAMES: Record<string, string> = Object.fromEntries(
  Meals.OPTIONS.map((o) => [o.key, o.label]),
);

/** A weigh-in's local day, from when it was logged. */
const dayOf = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * A plain-text summary of the last `span` days for the person to send to a dietitian,
 * therapist or doctor, built on the phone from their own export. It follows their display
 * choices: calories only if they track and show them, weight only if they track it. Written
 * notes are left out, since those were written for themselves.
 */
export function appointmentSummary(
  data: TernExport,
  choices: SummaryChoices,
  span: SummarySpan,
  today: string,
): string {
  const from = addDays(today, -(span - 1));
  const inSpan = (day: string | null): day is string =>
    day !== null && day >= from && day <= today;
  const days = Array.from({ length: span }, (_, i) => addDays(from, i));

  const lines: string[] = [
    `Tern summary: ${formatShortDate(from)} to ${formatShortDate(today)} (${span} days)`,
    'Made on my phone and shared by me. Tern is a tracking tool, not medical advice.',
  ];

  if (choices.trackFood) {
    const food = (data.food as Row[]).filter((r) => inSpan(str(r, 'logged_on')));
    const skipped = (data.skippedMeals as Row[]).filter((r) => inSpan(str(r, 'day')));
    const checkIns = (data.mealCheckins as Row[]).filter((r) => inSpan(str(r, 'day')));
    const showCalories = choices.trackCalories && choices.showCalories;
    const logged = days.filter(
      (d) =>
        food.some((r) => str(r, 'logged_on') === d) ||
        skipped.some((r) => str(r, 'day') === d),
    );

    lines.push('', 'MEALS', `Days with meals logged: ${logged.length} of ${span}`);
    for (const day of logged) {
      lines.push('', formatLongDate(day));
      for (const meal of Meals.ALL) {
        const names = food
          .filter((r) => str(r, 'logged_on') === day && str(r, 'meal') === meal)
          .map((r) => str(r, 'name'))
          .filter((n): n is string => Boolean(n));
        const wasSkipped = skipped.some(
          (r) => str(r, 'day') === day && str(r, 'meal') === meal,
        );
        if (!names.length && !wasSkipped) continue;
        const checkIn = checkIns.find(
          (r) => str(r, 'day') === day && str(r, 'meal') === meal,
        );
        const how =
          checkIn && num(checkIn, 'fullness') !== null && num(checkIn, 'feeling') !== null
            ? ` (${mealScoreWord(MealCheckInMetric.Fullness, num(checkIn, 'fullness')!)}, feeling ${mealScoreWord(MealCheckInMetric.Feeling, num(checkIn, 'feeling')!).toLowerCase()})`
            : '';
        const what = names.length ? names.join(', ') : 'nothing today';
        lines.push(`  ${MEAL_NAMES[meal] ?? meal}: ${what}${how}`);
      }
      if (showCalories) {
        const total = food
          .filter((r) => str(r, 'logged_on') === day)
          .reduce((sum, r) => sum + (num(r, 'calories') ?? 0), 0);
        if (total > 0) lines.push(`  About ${Math.round(total).toLocaleString('en-US')} calories`);
      }
    }
  }

  if (choices.trackWeight) {
    const weights = (data.weight as Row[])
      .map((r) => ({ at: str(r, 'logged_at'), lb: num(r, 'lb') }))
      .filter(
        (w): w is { at: string; lb: number } =>
          w.at !== null && w.lb !== null && inSpan(dayOf(w.at)),
      )
      .sort((a, b) => a.at.localeCompare(b.at));
    lines.push('', 'WEIGHT');
    lines.push(
      ...(weights.length
        ? weights.map(
            (w) => `  ${formatShortDate(dayOf(w.at))}: ${formatWeight(w.lb, choices.units)}`,
          )
        : ['  No weigh-ins']),
    );
  }

  if (choices.trackMood) {
    const moods = (data.moodCheckins as Row[])
      .filter((r) => inSpan(str(r, 'day')))
      .sort((a, b) => str(a, 'day')!.localeCompare(str(b, 'day')!));
    lines.push('', 'MOOD AND STRESS');
    lines.push(
      ...(moods.length
        ? moods.map(
            (r) => {
              const mood = num(r, 'mood') ?? MoodScale.DEFAULT;
              const stress = num(r, 'stress') ?? MoodScale.DEFAULT;
              return `  ${formatShortDate(str(r, 'day')!)}: mood ${mood}/${MoodScale.MAX} (${scoreWord(MoodMetric.Mood, mood).toLowerCase()}), stress ${stress}/${MoodScale.MAX} (${scoreWord(MoodMetric.Stress, stress).toLowerCase()})`;
            },
          )
        : ['  No check-ins']),
    );
  }

  if (choices.trackMovement) {
    const moves = (data.movementEntries as Row[]).filter((r) => inSpan(str(r, 'day')));
    const rest = (data.restDays as Row[]).filter((r) => inSpan(str(r, 'day')));
    lines.push('', 'MOVEMENT AND REST');
    const active = days.filter((d) => moves.some((r) => str(r, 'day') === d));
    lines.push(`  Days with movement logged: ${active.length} of ${span}`);
    lines.push(`  Rest days taken: ${rest.length}`);
  }

  return lines.join('\n');
}
