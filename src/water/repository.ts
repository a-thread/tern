import type { WaterEntry } from './models';

/** Each drink, by local day. */
export interface WaterRepository {
  /** Drinks from day `from` to `to` inclusive, oldest first. */
  load(from: string, to: string): Promise<WaterEntry[]>;
  add(entry: WaterEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

export function createMemoryWaterRepository(): WaterRepository {
  let entries: WaterEntry[] = [];
  return {
    load: async (from, to) =>
      entries.filter((e) => e.loggedOn >= from && e.loggedOn <= to),
    add: async (entry) => {
      entries = [...entries, entry];
    },
    remove: async (id) => {
      entries = entries.filter((e) => e.id !== id);
    },
  };
}
