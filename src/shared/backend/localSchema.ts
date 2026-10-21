/**
 * The on-device database's schema, the local counterpart of `supabase/migrations/`.
 * Append a migration to change it; never edit one that has shipped, since phones that
 * already ran it won't run it again. Tables mirror their Supabase ones, minus `user_id`:
 * the whole file belongs to the one person using the phone.
 */
export class LocalSchema {
  static readonly FILE_NAME = 'tern.db';

  static readonly MIGRATIONS: readonly string[] = [
    // 1: weight
    `CREATE TABLE weight_entries (
       id TEXT PRIMARY KEY,
       lb REAL NOT NULL,
       logged_at TEXT NOT NULL
     );
     CREATE INDEX weight_entries_logged_at ON weight_entries (logged_at);
     CREATE TABLE skipped_weigh_ins (day TEXT PRIMARY KEY)`,
  ];
}
