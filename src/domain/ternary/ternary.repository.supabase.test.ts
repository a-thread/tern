import type { TernClient } from '@shared/backend/supabase';
import { JoinOutcome, TernaryRules } from './models/ternary';
import { createSupabaseTernaryRepository } from './ternary.repository.supabase';

function fakeDb(data: unknown = null, error: unknown = null) {
  const rpc = jest.fn().mockResolvedValue({ data, error });
  return { db: { rpc } as unknown as TernClient, rpc };
}

describe('Supabase ternary repository', () => {
  it('asks the server for the ternary as it stands on the caller’s day', async () => {
    const { db, rpc } = fakeDb({ id: 't', name: 'Sunday Walkers' });
    const ternary = await createSupabaseTernaryRepository(db).mine('2026-11-10');
    expect(rpc).toHaveBeenCalledWith('ternary_state', { p_today: '2026-11-10' });
    expect(ternary?.name).toBe('Sunday Walkers');
  });

  it('is in no ternary when the server says so', async () => {
    const { db } = fakeDb(null);
    expect(await createSupabaseTernaryRepository(db).mine('2026-11-10')).toBeNull();
  });

  it('joins with the size cap, and reads the outcome', async () => {
    const { db, rpc } = fakeDb('full');
    expect(await createSupabaseTernaryRepository(db).join('KTW4QP', 'Ari')).toBe(
      JoinOutcome.Full,
    );
    expect(rpc).toHaveBeenCalledWith('ternary_join', {
      p_code: 'KTW4QP',
      p_display_name: 'Ari',
      p_max: TernaryRules.MAX_MEMBERS,
    });
  });

  it('brings a fish with the daily cap', async () => {
    const { db, rpc } = fakeDb();
    await createSupabaseTernaryRepository(db).bringFish('maya', '2026-11-10');
    expect(rpc).toHaveBeenCalledWith('ternary_bring_fish', {
      p_to: 'maya',
      p_day: '2026-11-10',
      p_max: TernaryRules.MAX_FISH_PER_DAY,
    });
  });

  it('sends only a dish’s name and foods', async () => {
    const { db, rpc } = fakeDb();
    await createSupabaseTernaryRepository(db).bringDish('1-iceland', {
      name: 'Soup',
      foods: ['Lentils'],
    });
    expect(rpc).toHaveBeenCalledWith('ternary_bring_dish', {
      p_stop: '1-iceland',
      p_name: 'Soup',
      p_foods: ['Lentils'],
    });
  });

  it('passes a server failure on', async () => {
    const { db } = fakeDb(null, new Error('Ternaries need Tern Plus'));
    await expect(createSupabaseTernaryRepository(db).leave()).rejects.toThrow(
      'Ternaries need Tern Plus',
    );
  });
});
