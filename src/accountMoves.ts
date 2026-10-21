import type { LocalDb } from '@shared/backend/localDb';
import { getLocalMeta, LocalMetaKey, setLocalMeta } from '@shared/backend/localMeta';
import type { DataRepository } from './domain/settings/dataRepository';
import { EXPORT_LISTS, type TernExport } from './domain/settings/models/ternExport';

/**
 * Where someone's log lives follows Tern Plus. With it, in their account; without it, on
 * the phone. These two moves carry it across when that changes. Both merge rather than
 * overwrite, so nothing logged on either side is lost.
 */

const isEmpty = (copy: TernExport) =>
  copy.settings === null && EXPORT_LISTS.every((list) => copy[list].length === 0);

/**
 * Taking out (or renewing) Tern Plus: everything on the phone goes into the account, then
 * the phone's copy is cleared, since the account now holds it. A failed upload clears
 * nothing and is tried again next time. Resolves to how many rows the account gained.
 *
 * A log copied down from a different account (a shared phone, where someone else's Plus
 * ended) is that person's, so it never goes into this one.
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
  const added = await account.importAll!(copy);
  await phone.deleteAll();
  await setLocalMeta(db, LocalMetaKey.COPIED_FROM_ACCOUNT, null);
  return added;
}

/**
 * Tern Plus ended while signed in: the account's log is copied onto the phone, once per
 * account, so the app carries on with all of it. Resolves to true when it copied, false
 * when this account's log was already here.
 */
export async function copyToPhone(
  account: DataRepository,
  phone: DataRepository,
  db: LocalDb,
  userId: string,
): Promise<boolean> {
  if ((await getLocalMeta(db, LocalMetaKey.COPIED_FROM_ACCOUNT)) === userId) {
    return false;
  }
  await phone.importAll!(await account.exportAll());
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
