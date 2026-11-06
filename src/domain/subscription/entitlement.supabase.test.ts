import type { TernClient } from '@shared/backend/supabase';
import { createSupabasePlusSync } from './entitlement.supabase';

type Answer = { data: unknown; error: unknown };

/** Just the two calls the sync makes: the `plus` function, and `has_plus` in the database. */
function client(fn: Answer, rpc: Answer) {
  const invoke = jest.fn(async () => fn);
  const callRpc = jest.fn(async () => rpc);
  const db = { functions: { invoke }, rpc: callRpc } as unknown as TernClient;
  return { db, invoke, rpc: callRpc };
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('createSupabasePlusSync', () => {
  it("takes the function's answer when it gives one", async () => {
    const { db, rpc } = client(
      { data: { entitled: false }, error: null },
      { data: true, error: null },
    );
    await expect(createSupabasePlusSync(db)()).resolves.toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('asks the database when the function fails, so a failure is not taken for Plus', async () => {
    const { db, rpc } = client(
      { data: null, error: new Error('500') },
      { data: false, error: null },
    );
    await expect(createSupabasePlusSync(db)()).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledWith('has_plus');
  });

  it('counts Plus the database counts', async () => {
    const { db } = client(
      { data: null, error: new Error('500') },
      { data: true, error: null },
    );
    await expect(createSupabasePlusSync(db)()).resolves.toBe(true);
  });

  it('throws when neither can be asked', async () => {
    const offline = new Error('offline');
    const { db } = client(
      { data: null, error: new Error('offline') },
      { data: null, error: offline },
    );
    await expect(createSupabasePlusSync(db)()).rejects.toBe(offline);
  });
});
