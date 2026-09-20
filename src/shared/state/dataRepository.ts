/** Everything Tern holds about one person, as stored (weights are in pounds). */
export type TernExport = {
  exportedAt: string;
  weightUnit: 'lb';
  settings: unknown;
  food: unknown[];
  weight: unknown[];
  waypoints: unknown[];
  restDays: unknown[];
  savedMeals: unknown[];
};

/** Whole-account operations: a copy of your data, and erasing it. */
export interface DataRepository {
  exportAll(): Promise<TernExport>;
  /** Erases everything Tern stores for the account. The login itself is kept. */
  deleteAll(): Promise<void>;
  /** Deletes the account itself, and with it everything stored for it. */
  deleteAccount(): Promise<void>;
}
