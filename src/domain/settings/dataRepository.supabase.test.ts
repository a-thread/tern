import type { TernClient } from '@shared/backend/supabase';
import { createSupabaseDataRepository } from './dataRepository.supabase';

const dbWithRpc = (rpc: jest.Mock) => ({ rpc }) as unknown as TernClient;

describe('deleteAccount', () => {
  it('calls the delete_my_account function', async () => {
    const rpc = jest.fn().mockResolvedValue({ error: null });
    await createSupabaseDataRepository(dbWithRpc(rpc)).deleteAccount();
    expect(rpc).toHaveBeenCalledWith('delete_my_account');
  });

  it('throws when the database refuses, so the app can say so', async () => {
    const rpc = jest.fn().mockResolvedValue({ error: new Error('nope') });
    await expect(createSupabaseDataRepository(dbWithRpc(rpc)).deleteAccount()).rejects.toThrow(
      'nope',
    );
  });
});
