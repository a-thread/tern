/** The days a user chose to rest. A day is either a rest day or it isn't; adding twice is harmless. */
export interface RestDaysRepository {
  /** Rest days from `from` to `to` inclusive, as YYYY-MM-DD keys. */
  load(from: string, to: string): Promise<string[]>;
  add(day: string): Promise<void>;
  remove(day: string): Promise<void>;
}

export function createMemoryRestDaysRepository(): RestDaysRepository {
  const days = new Set<string>();
  return {
    load: async (from, to) => [...days].filter((d) => d >= from && d <= to),
    add: async (day) => {
      days.add(day);
    },
    remove: async (day) => {
      days.delete(day);
    },
  };
}
