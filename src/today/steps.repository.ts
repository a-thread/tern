import { addDays, dayKey } from '@shared/utils/date';

/**
 * - `connected`: a step source is readable.
 * - `needs-permission`: a source exists, but the user hasn't allowed reading it yet.
 * - `unavailable`: no step source on this device or build (e.g. Expo Go).
 */
export type StepsStatus = 'connected' | 'needs-permission' | 'unavailable';

/** Where step counts come from (Health Connect on Android; mock data in local mode). */
export interface StepsRepository {
  status(): Promise<StepsStatus>;
  /** Asks the user for access to their steps; resolves to the status afterwards. */
  connect(): Promise<StepsStatus>;
  /** Steps per local day, keyed YYYY-MM-DD, for `from`..`to` inclusive. Empty unless connected. */
  getRange(from: string, to: string): Promise<Record<string, number>>;
}

/** No step source. Steps stay at zero, so nothing is awarded and nothing is invented. */
export function createUnavailableStepsRepository(): StepsRepository {
  return {
    status: async () => 'unavailable',
    connect: async () => 'unavailable',
    getRange: async () => ({}),
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A stable, plausible step count for a past day: mostly goal-ish days, some middling, a few quiet. */
export function mockStepsFor(day: string): number {
  const h = hash(day);
  const r = h % 100;
  if (r < 12) return 1200 + (h % 1600); // quiet
  if (r < 32) return 4200 + (h % 3200); // partway
  return 8300 + (h % 3700); // goal
}

/** Local-mode steps: deterministic mock history, with today part-way through. */
export function createMemoryStepsRepository(
  now: () => Date = () => new Date(),
): StepsRepository {
  return {
    status: async () => 'connected',
    connect: async () => 'connected',
    getRange: async (from, to) => {
      const today = dayKey(now());
      const out: Record<string, number> = {};
      for (let d = from; d <= to && d <= today; d = addDays(d, 1)) {
        out[d] = d === today ? 6842 : mockStepsFor(d);
      }
      return out;
    },
  };
}
