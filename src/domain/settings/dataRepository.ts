import type { TernExport } from './models/ternExport';

/** Whole-account operations: a copy of your data, and erasing it. */
export interface DataRepository {
  exportAll(): Promise<TernExport>;
  /** Erases everything Tern stores for the account. The login itself is kept. */
  deleteAll(): Promise<void>;
  /** Deletes the account itself, and with it everything stored for it. */
  deleteAccount(): Promise<void>;
  /** Merges, keeping existing rows; resolves to rows added. Settings: the phone takes the file's, an account keeps its own. */
  importAll?(copy: TernExport): Promise<number>;
}
