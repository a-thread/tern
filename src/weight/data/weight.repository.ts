import { seedWeightEntries } from './weight.mock';
import type { WeightEntry } from '@weight/models/weightEntry';

export interface WeightRepository {
  /** Newest first. */
  load(): Promise<WeightEntry[]>;
  add(entry: WeightEntry): Promise<void>;
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
  };
}
