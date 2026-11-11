import eas from '../../../eas.json';
import { Milestones } from '../waypoints/models/milestone';
import { Presence } from './models/ternary';
import { sampleFriends } from './sampleFriends';
import {
  createMemoryTernaryRepository,
  type TernaryRepository,
  withSampleFriends,
} from './ternary.repository';

type Profile = { env?: Record<string, string> };
const profiles = eas.build as Record<string, Profile>;
const TODAY = '2026-11-10';

describe('sample friends for trying ternaries locally', () => {
  const before = process.env.EXPO_PUBLIC_SAMPLE_FRIENDS;
  afterEach(() => {
    if (before === undefined) delete process.env.EXPO_PUBLIC_SAMPLE_FRIENDS;
    else process.env.EXPO_PUBLIC_SAMPLE_FRIENDS = before;
  });

  it('is never on in an EAS build', () => {
    for (const profile of Object.values(profiles)) {
      expect(profile.env?.EXPO_PUBLIC_SAMPLE_FRIENDS).toBeUndefined();
    }
  });

  it('is on only when asked for', () => {
    delete process.env.EXPO_PUBLIC_SAMPLE_FRIENDS;
    expect(sampleFriends()).toBe(false);
    process.env.EXPO_PUBLIC_SAMPLE_FRIENDS = '1';
    expect(sampleFriends()).toBe(__DEV__);
  });
});

describe('withSampleFriends', () => {
  async function inTernary() {
    const real = createMemoryTernaryRepository();
    await real.create('Silly Goose', 'Aiden');
    const spy = {
      ...real,
      bringFish: jest.fn(real.bringFish),
      block: jest.fn(real.block),
    } satisfies TernaryRepository;
    return { real: spy, repo: withSampleFriends(spy) };
  }

  it('adds friends here, resting and quiet to your real ternary', async () => {
    const { repo } = await inTernary();
    const t = (await repo.mine(TODAY))!;
    expect(t.sample).toBe(true);
    expect(t.members[0].name).toBe('Aiden');
    expect(t.members.map((m) => m.presence)).toEqual(
      expect.arrayContaining([Presence.Here, Presence.Resting, null]),
    );
    expect(t.fish.length).toBeGreaterThan(0);
    expect(t.postcards.length).toBeGreaterThan(0);
  });

  it('moves the bird on to a stop so its table has dishes', async () => {
    const { repo } = await inTernary();
    const t = (await repo.mine(TODAY))!;
    expect(t.total).toBeGreaterThan(Milestones.STOPS[1].waypoints);
    expect(t.dishes.length).toBeGreaterThan(0);
  });

  it('shows nothing when you are in no ternary', async () => {
    expect(await withSampleFriends(createMemoryTernaryRepository()).mine(TODAY)).toBeNull();
  });

  it('keeps fish and blocks for a made-up friend on the phone', async () => {
    const { real, repo } = await inTernary();
    await repo.bringFish('sample-maya', TODAY);
    expect(real.bringFish).not.toHaveBeenCalled();
    expect((await repo.mine(TODAY))!.fishSentToday).toBe(1);
    await repo.block('sample-maya');
    expect(real.block).not.toHaveBeenCalled();
    expect((await repo.mine(TODAY))!.members.some((m) => m.name === 'Maya')).toBe(false);
  });

  it('still sends what you do to a real friend', async () => {
    const { real, repo } = await inTernary();
    await repo.block('someone-real');
    expect(real.block).toHaveBeenCalledWith('someone-real');
  });

  it('lists a blocked made-up friend so they can be unblocked', async () => {
    const { repo } = await inTernary();
    await repo.block('sample-maya');
    expect((await repo.mine(TODAY))!.blocked).toEqual([
      { userId: 'sample-maya', name: 'Maya' },
    ]);
    await repo.unblock('sample-maya');
    const t = (await repo.mine(TODAY))!;
    expect(t.blocked).toEqual([]);
    expect(t.members.some((m) => m.name === 'Maya')).toBe(true);
  });
});

describe('blocking in memory', () => {
  it('hides a friend, lists them as blocked, and brings them back on unblock', async () => {
    const repo = createMemoryTernaryRepository();
    await repo.join('KTW4QP', 'Aiden');
    await repo.block('maya');
    let t = (await repo.mine(TODAY))!;
    expect(t.members.some((m) => m.userId === 'maya')).toBe(false);
    expect(t.dishes.some((d) => d.fromId === 'maya')).toBe(false);
    expect(t.blocked).toEqual([{ userId: 'maya', name: 'Maya' }]);

    await repo.unblock('maya');
    t = (await repo.mine(TODAY))!;
    expect(t.members.some((m) => m.userId === 'maya')).toBe(true);
    expect(t.blocked).toEqual([]);
  });

  it('never blocks you', async () => {
    const repo = createMemoryTernaryRepository();
    await repo.join('KTW4QP', 'Aiden');
    await repo.block('you');
    expect((await repo.mine(TODAY))!.blocked).toEqual([]);
  });
});
