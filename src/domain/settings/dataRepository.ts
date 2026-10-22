import type { TernExport } from './models/ternExport';

/** Whole-account operations: a copy of your data, and erasing it. */
export interface DataRepository {
  exportAll(): Promise<TernExport>;
  /** Erases everything Tern stores for the account. The login itself is kept. */
  deleteAll(): Promise<void>;
  /** Deletes the account itself, and with it everything stored for it. */
  deleteAccount(): Promise<void>;
  /**
   * Adds everything in an export, keeping what is already here: a row with the same key
   * (the same entry, or the same day's rest day) is left as it is, and one that doesn't
   * fit is skipped. Resolves to how many rows were added. On the phone the file's settings
   * replace the saved ones; an account keeps its own if it has any.
   */
  importAll?(copy: TernExport): Promise<number>;
}
