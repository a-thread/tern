import { addDays, dayKey } from '@shared/utils/date';
import { StepsStatus } from './models/stepsStatus';

export interface StepsRepository {
  status(): Promise<StepsStatus>;
  connect(): Promise<StepsStatus>;
  /** Inclusive; empty unless connected. */
  getRange(from: string, to: string): Promise<Record<string, number>>;
}

export function createUnavailableStepsRepository(): StepsRepository {
  return {
    status: async () => StepsStatus.Unavailable,
    connect: async () => StepsStatus.Unavailable,
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

export function mockStepsFor(day: string): number {
  const h = hash(day);
  const r = h % 100;
  if (r < 12) return 1200 + (h % 1600); // quiet
  if (r < 32) return 4200 + (h % 3200); // partway
  return 8300 + (h % 3700); // goal
}

/** Deterministic mock steps; with `days`, only the last that many have any. */
export function createMemoryStepsRepository(
  now: () => Date = () => new Date(),
  days?: number,
): StepsRepository {
  return {
    status: async () => StepsStatus.Connected,
    connect: async () => StepsStatus.Connected,
    getRange: async (from, to) => {
      const today = dayKey(now());
      const first = days ? addDays(today, -(days - 1)) : from;
      const out: Record<string, number> = {};
      for (
        let d = from > first ? from : first;
        d <= to && d <= today;
        d = addDays(d, 1)
      ) {
        out[d] = d === today ? 6842 : mockStepsFor(d);
      }
      return out;
    },
  };
}
