import type { MovementEntry } from '@movement/models/movementEntry';

/** Movement logged by hand, by local day. Health Connect workouts are read separately and never stored. */
export interface MovementRepository {
  /** Entries from day `from` to `to` inclusive, oldest first. */
  load(from: string, to: string): Promise<MovementEntry[]>;
  add(entry: MovementEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createMemoryMovementRepository(initial: MovementEntry[] = []): MovementRepository {
  let entries = [...initial];
  return {
    load: async (from, to) =>
      entries
        .filter((e) => e.day >= from && e.day <= to)
        .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)),
    add: async (entry) => {
      entries = [...entries, entry];
    },
    remove: async (id) => {
      entries = entries.filter((e) => e.id !== id);
    },
  };
}
