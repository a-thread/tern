import { seedWeightEntries } from './weight.mock';
import type { WeightEntry } from './models/weightEntry';

export interface WeightRepository {
  /** Newest first. */
  load(): Promise<WeightEntry[]>;
  add(entry: WeightEntry): Promise<void>;
  /** Corrects a logged weight, keeping when it was logged. */
  update(id: string, lb: number): Promise<void>;
  /** The recent days (YYYY-MM-DD) marked "not weighing in". */
  loadSkipped(): Promise<string[]>;
  setSkipped(day: string, skipped: boolean): Promise<void>;
}

export function createMemoryWeightRepository(
  initial: WeightEntry[] = seedWeightEntries(),
  initialSkipped: string[] = [],
): WeightRepository {
  let entries = [...initial];
  let skippedDays = [...initialSkipped];
  return {
    load: async () => [...entries],
    add: async (entry) => {
      entries = [entry, ...entries];
    },
    update: async (id, lb) => {
      entries = entries.map((e) => (e.id === id ? { ...e, lb } : e));
    },
    loadSkipped: async () => [...skippedDays],
    setSkipped: async (day, skipped) => {
      skippedDays = skippedDays.filter((d) => d !== day);
      if (skipped) skippedDays.push(day);
    },
  };
}
