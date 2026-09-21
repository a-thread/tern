import type { MoodEntry } from './models';

/** One mood and stress check-in per local day. */
export interface MoodRepository {
  /** Check-ins from day `from` to `to` inclusive, oldest first. */
  load(from: string, to: string): Promise<MoodEntry[]>;
  /** Saves the day's check-in, replacing any earlier one that day. */
  save(entry: MoodEntry): Promise<void>;
  remove(day: string): Promise<void>;
}

export function createMemoryMoodRepository(): MoodRepository {
  let entries: MoodEntry[] = [];
  return {
    load: async (from, to) =>
      entries
        .filter((e) => e.day >= from && e.day <= to)
        .sort((a, b) => a.day.localeCompare(b.day)),
    save: async (entry) => {
      entries = [...entries.filter((e) => e.day !== entry.day), entry];
    },
    remove: async (day) => {
      entries = entries.filter((e) => e.day !== day);
    },
  };
}
