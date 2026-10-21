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
   * (the same entry, or the same day's rest day) is left as it is. Saved settings are
   * replaced by the file's. Resolves to how many rows were added. Only the phone's
   * database offers it; an account's ledger only accepts today's awards.
   */
  importAll?(copy: TernExport): Promise<number>;
}
