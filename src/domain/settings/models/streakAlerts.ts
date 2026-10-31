import { addDays, dayKey, parseDayKey } from '@shared/utils/date';
import { dayNumber, variantFor, type ReminderText } from './mealMessages';

/** When streak notifications fire, and the ids they're scheduled under. */
export class StreakAlerts {
  /** The evening heads-up when today's goal isn't reached yet (minutes since midnight). */
  static readonly AT_RISK_AT = 20 * 60;
  /** The morning note after a freeze held the streak. */
  static readonly MORNING_AT = 9 * 60;
  static readonly AT_RISK_ID = 'tern-streak-risk';
  static readonly OUTCOME_ID = 'tern-streak-outcome';
  static readonly ALL_IDS = [StreakAlerts.AT_RISK_ID, StreakAlerts.OUTCOME_ID];
}

export type StreakAlertInput = {
  on: boolean;
  /** Streak as it stands now (today still in progress), see `computeStreak`. */
  streak: number;
  freezes: number;
  /** Today's steps have been read and the goal isn't reached (by steps or movement) or a rest day taken. */
  todayOpen: boolean;
  /** Rest days left this week: taking one is a way to keep the streak, so it's named. */
  restLeft?: number;
  /** A day under the goal turns into a rest day by itself (auto-detect, with allowance left). */
  restCovers?: boolean;
  /** Movement is tracked, so it's a way to today's goal as well as steps. */
  movement?: boolean;
  now: Date;
};

export type PlannedStreakAlert = ReminderText & { id: string; at: Date };

/** "Reaching your goal, or taking a rest day, keeps it going." */
function keepsItGoing(input: StreakAlertInput): string {
  const goal = input.movement
    ? 'Reaching your step or movement goal'
    : 'Reaching your step goal';
  if (input.restCovers)
    return `${goal} adds a day. If not, a rest day holds it.`;
  if ((input.restLeft ?? 0) > 0)
    return `${goal}, or taking a rest day, keeps it going.`;
  return `${goal} keeps it going.`;
}

/** Neutral: where the streak stands and what keeps it, never what would be lost. */
const evening = (input: StreakAlertInput): ReminderText[] => {
  const n = input.streak;
  const keep = keepsItGoing(input);
  const freezeLine =
    !input.restCovers && input.freezes > 0
      ? ' A streak freeze has your back if not.'
      : '';
  return [
    {
      title: 'Today so far',
      body: `You’re ${n} days in. ${keep}${freezeLine}`,
    },
    {
      title: 'Your streak',
      body: `${n} days and counting. ${keep}${freezeLine}`,
    },
    {
      title: 'This evening',
      body: `Your ${n}-day streak is waiting on today's goal.${freezeLine}`,
    },
  ];
};

const frozen = (n: number): ReminderText[] => [
  {
    title: 'Freeze used',
    body: `A streak freeze covered yesterday, so your ${n}-day streak still stands.`,
  },
  {
    title: 'Streak protected',
    body: `Yesterday was covered by a freeze and your ${n} days still stand.`,
  },
];

/**
 * The streak notifications to have scheduled. Both only exist while a streak is worth
 * protecting and today isn't settled, so reaching the goal (or taking a rest day) and
 * syncing clears them:
 *  - this evening, a heads-up that the streak is still open today;
 *  - tomorrow morning, a note that a freeze held it, if today's goal never gets reached and
 *    a freeze (not a rest day) is what covers the day. A streak that ends gets no note.
 */
export function planStreakAlerts(
  input: StreakAlertInput,
): PlannedStreakAlert[] {
  const { on, streak, freezes, todayOpen, now } = input;
  if (!on || streak <= 0 || !todayOpen) return [];
  const today = dayKey(now);
  const day = dayNumber(now);
  const out: PlannedStreakAlert[] = [];

  const eveningAt = atTime(today, StreakAlerts.AT_RISK_AT);
  if (eveningAt > now) {
    out.push({
      id: StreakAlerts.AT_RISK_ID,
      at: eveningAt,
      ...variantFor(evening(input), day),
    });
  }

  if (freezes > 0 && !input.restCovers) {
    out.push({
      id: StreakAlerts.OUTCOME_ID,
      at: atTime(addDays(today, 1), StreakAlerts.MORNING_AT),
      ...variantFor(frozen(streak), day),
    });
  }
  return out;
}

function atTime(key: string, minutes: number): Date {
  const d = parseDayKey(key);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}
