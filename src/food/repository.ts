import { foodLog as seed } from './mock';
import type { FoodEntry } from './models';

export type NewFoodEntry = Omit<FoodEntry, 'id'>;

/**
 * Where food entries are stored. The app talks to this interface only, so
 * the in-memory version below (used with no Supabase keys, and in tests) and
 * the Supabase one are interchangeable. Ids are chosen by the caller so an
 * optimistic add keeps the same id once it's persisted.
 */
export interface FoodRepository {
  /** Entries logged on `day` (local YYYY-MM-DD). */
  load(day: string): Promise<FoodEntry[]>;
  /** Entries grouped by day for `from`..`to` inclusive. Days with nothing logged are absent. */
  history(from: string, to: string): Promise<Record<string, FoodEntry[]>>;
  add(day: string, entry: FoodEntry): Promise<void>;
  update(id: string, patch: Partial<NewFoodEntry>): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createMemoryFoodRepository(
  initial: FoodEntry[] = seed,
): FoodRepository {
  let entries = [...initial];
  return {
    load: async () => [...entries],
    // Local mode keeps one day's log, so history is just that day (the end of the range).
    history: async (_from, to) => (entries.length ? { [to]: [...entries] } : {}),
    add: async (_day, entry) => {
      entries = [...entries, entry];
    },
    update: async (id, patch) => {
      entries = entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
    },
    remove: async (id) => {
      entries = entries.filter((e) => e.id !== id);
    },
  };
}
