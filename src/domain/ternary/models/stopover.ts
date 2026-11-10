import { addDays } from '@shared/utils/date';
import {
  latestMilestone,
  type Milestone,
  Milestones,
} from '../../waypoints/models/milestone';
import { TernaryRules } from './ternary';

/**
 * What to bring to each stopover table. Warm, social and about the place or the people,
 * never about the food's numbers: no "light", "healthy", "clean" or "guilt-free".
 */
export class StopoverPrompts {
  static readonly ALL: readonly string[] = [
    'Bring something warming',
    'Bring something you’d make for a friend',
    'Bring something from where you grew up',
    'Bring something that travels well',
    'Bring something you learned from someone',
    'Bring something for a slow evening',
    'Bring something bright',
    'Bring something you could eat every week',
  ];

  /** Words that never appear in a prompt: a test holds the list to it. */
  static readonly NEVER: readonly string[] = [
    'light',
    'healthy',
    'clean',
    'guilt',
    'diet',
    'skinny',
    'low',
    'calorie',
  ];
}

/** The stop the shared bird is resting at, where its table is set; null before the first. */
export const restingAt = (total: number): Milestone | null =>
  latestMilestone(total);

/** The prompt for a stop's table, the same for everyone in the ternary. */
export function promptFor(stopId: string): string {
  const base = stopId.replace(/^\d+-/, '');
  const i = Milestones.STOPS.findIndex((s) => s.id === base);
  return StopoverPrompts.ALL[Math.max(i, 0) % StopoverPrompts.ALL.length];
}

/** The route stop for an id with or without its lap ("2-iceland" or "iceland"). */
export const stopNamed = (stopId: string) =>
  Milestones.STOPS.find((s) => s.id === stopId.replace(/^\d+-/, ''));

/** The last arrival paid on this phone or account: which stop, and the day. */
export type ArrivalSeen = { stop: string | null; day: string | null };

/**
 * Whether the shared bird's latest stop pays the 25-waypoint arrival bonus today, and what to
 * remember afterwards. The first look only remembers, so joining a ternary that's already
 * flown far doesn't pay out for stops reached without you. After that each new stop pays
 * once, at most once a week.
 */
export function arrivalDue(
  total: number,
  seen: ArrivalSeen | null,
  today: string,
): { pay: boolean; seen: ArrivalSeen } {
  const latest = latestMilestone(total)?.id ?? null;
  if (!seen) return { pay: false, seen: { stop: latest, day: null } };
  if (latest === null || latest === seen.stop) return { pay: false, seen };
  if (seen.day && addDays(seen.day, TernaryRules.ARRIVAL_EVERY_DAYS) > today) {
    return { pay: false, seen };
  }
  return { pay: true, seen: { stop: latest, day: today } };
}
