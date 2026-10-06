import { addDays, dayKey, parseDayKey } from '@shared/utils/date';
import { dayNumber, variantFor, type ReminderText } from '@settings/models/mealMessages';

/** When streak notifications fire, and the ids they're scheduled under. */
export class StreakAlerts {
  /** The evening heads-up when today's goal isn't reached yet (minutes since midnight). */
  static readonly AT_RISK_AT = 20 * 60;
  /** The morning note after a streak ended, or a freeze held it. */
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
  /** Today's steps have been read and the goal isn't reached or a rest day taken. */
  todayOpen: boolean;
  now: Date;
};

export type PlannedStreakAlert = ReminderText & { id: string; at: Date };

const atRisk = (n: number, freezes: number): ReminderText[] => {
  const days = `${n}-day`;
  const freezeLine = freezes > 0 ? ' A streak freeze has your back if not.' : '';
  return [
    { title: 'Your streak is waiting', body: `Your ${days} streak is still going. A walk this evening keeps it that way.${freezeLine}` },
    { title: 'Still time tonight', body: `A short stroll would carry your ${days} streak into tomorrow.${freezeLine}` },
    { title: 'Evening steps?', body: `You’re ${n} days in. Open Tern to see how today is looking.${freezeLine}` },
    { title: 'Streak check', body: `Day ${n + 1} is within reach. Even a few minutes outside helps.${freezeLine}` },
  ];
};

const ended = (n: number): ReminderText[] => [
  { title: 'A fresh start', body: `Your ${n}-day streak ended yesterday. Today is a good day to begin the next one.` },
  { title: 'New streak, new day', body: `${n} days is a real run. Whenever you’re ready, start another today.` },
  { title: 'Onward', body: `Yesterday’s steps fell short of the goal, and that’s okay. A new streak starts with today’s walk.` },
];

const frozen = (n: number): ReminderText[] => [
  { title: 'Freeze used', body: `A streak freeze covered yesterday, so your ${n}-day streak is safe. Today is a fresh chance.` },
  { title: 'Streak protected', body: `Yesterday was covered by a freeze and your ${n} days still stand.` },
];

/**
 * The streak notifications to have scheduled. Both only exist while a streak is worth
 * protecting and today isn't settled, so reaching the goal (or taking a rest day) and
 * syncing clears them:
 *  - this evening, a heads-up that the streak is waiting on today's steps;
 *  - tomorrow morning, a note on how it turned out if today's goal never gets reached
 *    (a freeze covered it, or the streak ended). Without a freeze left, that's the loss.
 */
export function planStreakAlerts({ on, streak, freezes, todayOpen, now }: StreakAlertInput): PlannedStreakAlert[] {
  if (!on || streak <= 0 || !todayOpen) return [];
  const today = dayKey(now);
  const day = dayNumber(now);
  const out: PlannedStreakAlert[] = [];

  const evening = atTime(today, StreakAlerts.AT_RISK_AT);
  if (evening > now) {
    out.push({ id: StreakAlerts.AT_RISK_ID, at: evening, ...variantFor(atRisk(streak, freezes), day) });
  }

  const morning = atTime(addDays(today, 1), StreakAlerts.MORNING_AT);
  const outcome = freezes > 0 ? frozen(streak) : ended(streak);
  out.push({ id: StreakAlerts.OUTCOME_ID, at: morning, ...variantFor(outcome, day) });
  return out;
}

function atTime(key: string, minutes: number): Date {
  const d = parseDayKey(key);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}
