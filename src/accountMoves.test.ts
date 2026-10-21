import type { LocalDb } from '@shared/backend/localDb';
import { createMigratedSqlJsDb } from '@shared/backend/localDb.sqljs';
import { getLocalMeta, LocalMetaKey } from '@shared/backend/localMeta';
import { createLocalDataRepository } from './domain/settings/dataRepository.local';
import { createLocalRestDaysRepository } from './domain/activity/restDays.repository.local';
import { copyToPhone, lapsedData, moveToAccount } from './accountMoves';

// The account is played by a second database: the moves only see a DataRepository.
async function sides() {
  const phoneDb = await createMigratedSqlJsDb();
  const accountDb = await createMigratedSqlJsDb();
  return {
    phoneDb,
    phone: createLocalDataRepository(phoneDb),
    account: createLocalDataRepository(accountDb),
    phoneRest: createLocalRestDaysRepository(phoneDb),
    accountRest: createLocalRestDaysRepository(accountDb),
  };
}

const restDays = (repo: ReturnType<typeof createLocalRestDaysRepository>) =>
  repo.load('2026-01-01', '2026-12-31').then((d) => d.sort());

const copiedFrom = (db: LocalDb) => getLocalMeta(db, LocalMetaKey.COPIED_FROM_ACCOUNT);

describe('moveToAccount', () => {
  it("adds the phone's log to the account, then clears the phone", async () => {
    const s = await sides();
    await s.phoneRest.add('2026-10-17');
    await s.accountRest.add('2026-10-18');
    expect(await moveToAccount(s.phone, s.account, s.phoneDb, 'me')).toBe(1);
    expect(await restDays(s.accountRest)).toEqual(['2026-10-17', '2026-10-18']);
    expect(await restDays(s.phoneRest)).toEqual([]);
  });

  it('does nothing when the phone has nothing', async () => {
    const s = await sides();
    const importAll = jest.spyOn(s.account, 'importAll');
    expect(await moveToAccount(s.phone, s.account, s.phoneDb, 'me')).toBe(0);
    expect(importAll).not.toHaveBeenCalled();
  });

  it('clears nothing on the phone when the upload fails', async () => {
    const s = await sides();
    await s.phoneRest.add('2026-10-17');
    s.account.importAll = async () => {
      throw new Error('offline');
    };
    await expect(moveToAccount(s.phone, s.account, s.phoneDb, 'me')).rejects.toThrow();
    expect(await restDays(s.phoneRest)).toEqual(['2026-10-17']);
  });

  it("never puts another account's copied log into this one", async () => {
    const s = await sides();
    await s.accountRest.add('2026-10-18');
    await copyToPhone(s.account, s.phone, s.phoneDb, 'someone-else');
    const mine = createLocalDataRepository(await createMigratedSqlJsDb());
    expect(await moveToAccount(s.phone, mine, s.phoneDb, 'me')).toBe(0);
    expect(await restDays(s.phoneRest)).toEqual(['2026-10-18']);
  });

  it('takes back its own copied log on renewing, and forgets the copy', async () => {
    const s = await sides();
    await s.accountRest.add('2026-10-18');
    await copyToPhone(s.account, s.phone, s.phoneDb, 'me');
    await s.phoneRest.add('2026-10-19'); // logged while Plus had ended
    expect(await moveToAccount(s.phone, s.account, s.phoneDb, 'me')).toBe(1);
    expect(await restDays(s.accountRest)).toEqual(['2026-10-18', '2026-10-19']);
    expect(await copiedFrom(s.phoneDb)).toBeNull();
  });
});

describe('copyToPhone', () => {
  it("copies the account's log onto the phone once per account", async () => {
    const s = await sides();
    await s.accountRest.add('2026-10-18');
    expect(await copyToPhone(s.account, s.phone, s.phoneDb, 'me')).toBe(true);
    expect(await restDays(s.phoneRest)).toEqual(['2026-10-18']);
    await s.phoneRest.remove('2026-10-18');
    // A second launch while Plus is still off must not bring back what was removed.
    expect(await copyToPhone(s.account, s.phone, s.phoneDb, 'me')).toBe(false);
    expect(await restDays(s.phoneRest)).toEqual([]);
  });
});

describe('lapsedData', () => {
  it('erases both copies, and exports and restores on the phone', async () => {
    const s = await sides();
    await s.accountRest.add('2026-10-18');
    await copyToPhone(s.account, s.phone, s.phoneDb, 'me');
    const data = lapsedData(s.phone, s.account);
    expect((await data.exportAll()).restDays).toEqual([{ day: '2026-10-18' }]);
    await data.deleteAll();
    expect(await restDays(s.phoneRest)).toEqual([]);
    expect(await restDays(s.accountRest)).toEqual([]);
  });
});
