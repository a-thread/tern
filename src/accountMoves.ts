import type { LocalDb } from '@shared/backend/localDb';
import { getLocalMeta, LocalMetaKey, setLocalMeta } from '@shared/backend/localMeta';
import type { DataRepository } from './domain/settings/dataRepository';
import { TernExportLists, type TernExport } from './domain/settings/models/ternExport';

/**
 * Where someone's log lives follows Tern Plus. With it, in their account; without it, on
 * the phone. These two moves carry it across when that changes, so nothing logged on
 * either side is lost.
 */

const isEmpty = (copy: TernExport) =>
  copy.settings === null && TernExportLists.ALL.every((list) => copy[list].length === 0);

/**
 * Taking out (or renewing) Tern Plus: everything on the phone goes into the account, then
 * the phone's copy is cleared, since the account now holds it. A failed upload clears
 * nothing and is tried again next time. Resolves to how many rows went into the account.
 *
 * A log copied down from a different account (a shared phone, where someone else's Plus
 * ended) is that person's, so it never goes into this one.
 *
 * Renewing: the phone holds this account's log as copied down, plus every change made
 * since (the account could not be written to meanwhile), so it replaces the account's
 * rather than merging, or edits, deletions and settings changes would be lost.
 */
export async function moveToAccount(
  phone: DataRepository,
  account: DataRepository,
  db: LocalDb,
  userId: string,
): Promise<number> {
  const copiedFrom = await getLocalMeta(db, LocalMetaKey.COPIED_FROM_ACCOUNT);
  if (copiedFrom !== null && copiedFrom !== userId) return 0;
  const copy = await phone.exportAll();
  if (isEmpty(copy)) return 0;
  // A failed import after this leaves the phone as it was, so the next try restores it.
  if (copiedFrom === userId) await account.deleteAll();
  const added = await account.importAll!(copy);
  await phone.deleteAll();
  await setLocalMeta(db, LocalMetaKey.COPIED_FROM_ACCOUNT, null);
  return added;
}

/**
 * Tern Plus ended while signed in: the account's log is copied onto the phone, once per
 * account, so the app carries on with all of it. Resolves to true when it copied, false
 * when this account's log was already here.
 *
 * A log already copied down from a different account (a shared phone) is cleared first,
 * so the two never mix: that account still has its own copy.
 */
export async function copyToPhone(
  account: DataRepository,
  phone: DataRepository,
  db: LocalDb,
  userId: string,
): Promise<boolean> {
  const copiedFrom = await getLocalMeta(db, LocalMetaKey.COPIED_FROM_ACCOUNT);
  if (copiedFrom === userId) return false;
  const copy = await account.exportAll();
  if (copiedFrom !== null) await phone.deleteAll();
  await phone.importAll!(copy);
  await setLocalMeta(db, LocalMetaKey.COPIED_FROM_ACCOUNT, userId);
  return true;
}

/**
 * Export and erase while Tern Plus has ended: the phone holds the log, the account still
 * has its copy, so erasing has to reach both, and an export comes from the phone (which
 * has everything the account had, and anything logged since).
 */
export function lapsedData(
  phone: DataRepository,
  account: DataRepository,
): DataRepository {
  return {
    exportAll: () => phone.exportAll(),
    async deleteAll() {
      await account.deleteAll();
      await phone.deleteAll();
    },
    async deleteAccount() {
      await account.deleteAccount();
      await phone.deleteAll();
    },
    importAll: (copy) => phone.importAll!(copy),
  };
}
