import type { LocalDb } from './localDb';

/** Small facts about the phone's database itself, not the person's data (so never exported or erased). */
export class LocalMetaKey {
  /** The account whose log was last copied onto the phone when its Tern Plus ended. */
  static readonly COPIED_FROM_ACCOUNT = 'copied_from_account';
}

export async function getLocalMeta(db: LocalDb, key: string): Promise<string | null> {
  const [row] = await db.all<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

/** Sets `key`, or clears it with null. */
export async function setLocalMeta(
  db: LocalDb,
  key: string,
  value: string | null,
): Promise<void> {
  await db.run(
    value === null
      ? 'DELETE FROM meta WHERE key = ?'
      : 'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
    value === null ? [key] : [key, value],
  );
}
