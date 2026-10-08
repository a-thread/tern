import { seedWeightEntries } from './weight.mock';
import type { WeightEntry } from '@weight/models/weightEntry';

export interface WeightRepository {
  /** Newest first. */
  load(): Promise<WeightEntry[]>;
  add(entry: WeightEntry): Promise<void>;
  /** Corrects a logged weight, keeping when it was logged. */
  update(id: string, lb: number): Promise<void>;
}

export function createMemoryWeightRepository(
  initial: WeightEntry[] = seedWeightEntries(),
): WeightRepository {
  let entries = [...initial];
  return {
    load: async () => [...entries],
    add: async (entry) => {
      entries = [entry, ...entries];
    },
    update: async (id, lb) => {
      entries = entries.map((e) => (e.id === id ? { ...e, lb } : e));
    },
  };
}
