import type { LocalDb } from '@shared/backend/localDb';
import {
  getLocalMeta,
  LocalMetaKey,
  setLocalMeta,
} from '@shared/backend/localMeta';
import type { DataRepository } from './domain/settings/dataRepository';
import {
  TernExportLists,
  type TernExport,
} from './domain/settings/models/ternExport';

/** The log lives in the account with Plus, on the phone without; these carry it across. */

const isEmpty = (copy: TernExport) =>
  copy.settings === null &&
  TernExportLists.ALL.every((list) => copy[list].length === 0);

/**
 * Uploads then clears the phone; a failed upload clears nothing. Another account's copy never
 * goes in. On renewal it replaces rather than merges, or offline edits and deletions would be lost.
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

/** Once per account; another account's copy is cleared first so logs never mix. */
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

/** Lapsed: erase reaches both; export comes from the phone, which has everything. */
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
