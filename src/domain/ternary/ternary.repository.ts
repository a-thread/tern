import { addDays } from '@shared/utils/date';
import { Milestones } from '../waypoints/models/milestone';
import { restingAt } from './models/stopover';
import {
  JoinOutcome,
  Presence,
  type Ternary,
  type TernaryMember,
  TernaryRules,
} from './models/ternary';

/**
 * Ternaries: the caller's circle of friends, and what they can do in it. Only an account
 * with Tern Plus has one, so there's no on-phone version: everyone in a ternary is signed in.
 * `today` is the caller's local day (YYYY-MM-DD) throughout.
 */
export interface TernaryRepository {
  /** The caller's ternary as it stands today, or null when they're in none. */
  mine(today: string): Promise<Ternary | null>;
  create(name: string, yourName: string): Promise<void>;
  join(code: string, yourName: string): Promise<JoinOutcome>;
  leave(): Promise<void>;
  setPrivacy(privacy: { flyPrivately: boolean; shareResting: boolean }): Promise<void>;
  bringFish(toUserId: string, today: string): Promise<void>;
  sendPostcard(stopId: string, today: string): Promise<void>;
  bringDish(stop: string, dish: { name: string; foods: string[] }): Promise<void>;
  /** Silent: each stops seeing the other, and neither is told. */
  block(userId: string): Promise<void>;
  report(kind: 'dish' | 'member', target: string): Promise<void>;
}

/** A ternary to try the screens with: two friends, one resting and one quiet. */
export function sampleTernary(today: string): Ternary {
  return {
    id: 'sample-ternary',
    name: 'Sunday Walkers',
    inviteCode: 'KTW4QP',
    total: 2100,
    members: [
      { userId: 'you', name: 'You', you: true, presence: Presence.Here },
      { userId: 'maya', name: 'Maya', you: false, presence: Presence.Here },
      { userId: 'jo', name: 'Jo', you: false, presence: Presence.Resting },
      { userId: 'sam', name: 'Sam', you: false, presence: null },
    ],
    fish: [{ id: 'f1', fromName: 'Maya', day: today }],
    fishSentToday: 0,
    postcards: [
      { id: 'p1', fromName: 'Maya', stopId: 'north-atlantic', day: addDays(today, -1), yours: false },
    ],
    dishes: [
      {
        id: 'd1',
        fromName: 'Maya',
        fromId: 'maya',
        stop: '1-iceland',
        name: 'Red lentil soup',
        foods: ['Red lentils', 'Carrot', 'Onion', 'Cumin', 'Coconut milk', 'Lime'],
        yours: false,
      },
    ],
    flyPrivately: false,
    shareResting: false,
  };
}

/**
 * In memory: for tests, and for trying ternaries without Supabase. Joining with the sample's
 * code joins the sample; creating starts a ternary of one.
 */
export function createMemoryTernaryRepository(
  initial: Ternary | null = null,
): TernaryRepository {
  let current = initial;
  const need = () => {
    if (!current) throw new Error('Not in a ternary');
    return current;
  };
  let next = 1;
  const id = (prefix: string) => `${prefix}-${next++}`;

  return {
    mine: async () => (current ? { ...current } : null),
    async create(name, yourName) {
      if (current) throw new Error('Already in a ternary');
      current = {
        id: id('ternary'),
        name,
        inviteCode: 'ABC234',
        total: 0,
        members: [{ userId: 'you', name: yourName, you: true, presence: null }],
        fish: [],
        fishSentToday: 0,
        postcards: [],
        dishes: [],
        flyPrivately: false,
        shareResting: false,
      };
    },
    async join(code, yourName) {
      if (current) return JoinOutcome.Already;
      const sample = sampleTernary('2026-01-01');
      if (code !== sample.inviteCode) return JoinOutcome.NotFound;
      current = {
        ...sampleTernary(new Date().toISOString().slice(0, 10)),
        members: sample.members.map((m) => (m.you ? { ...m, name: yourName } : m)),
      };
      return JoinOutcome.Joined;
    },
    async leave() {
      current = null;
    },
    async setPrivacy(privacy) {
      current = { ...need(), ...privacy };
    },
    async bringFish(toUserId) {
      const t = need();
      if (t.fishSentToday >= TernaryRules.MAX_FISH_PER_DAY) {
        throw new Error('That’s all the fish for today');
      }
      if (!t.members.some((m) => m.userId === toUserId && !m.you)) {
        throw new Error('Not in your ternary');
      }
      current = { ...t, fishSentToday: t.fishSentToday + 1 };
    },
    async sendPostcard(stopId, today) {
      const t = need();
      if (t.postcards.some((p) => p.yours && p.stopId === stopId)) return;
      current = {
        ...t,
        postcards: [
          { id: id('postcard'), fromName: 'You', stopId, day: today, yours: true },
          ...t.postcards,
        ],
      };
    },
    async bringDish(stop, dish) {
      const t = need();
      current = {
        ...t,
        dishes: [
          ...t.dishes.filter((d) => !(d.yours && d.stop === stop)),
          { id: id('dish'), fromName: 'You', fromId: 'you', stop, yours: true, ...dish },
        ],
      };
    },
    async block(userId) {
      const t = need();
      current = {
        ...t,
        members: t.members.filter((m) => m.userId !== userId),
        dishes: t.dishes.filter((d) => d.fromId !== userId),
      };
    },
    async report() {},
  };
}

/** Made-up friends start with this, so they're told apart from real accounts. */
const SAMPLE_ID = 'sample-';

/** One of each way a friend can look today: here, resting (shared), and quiet. */
const SAMPLE_MEMBERS: TernaryMember[] = [
  { userId: `${SAMPLE_ID}maya`, name: 'Maya', you: false, presence: Presence.Here },
  { userId: `${SAMPLE_ID}jo`, name: 'Jo', you: false, presence: Presence.Resting },
  { userId: `${SAMPLE_ID}ari`, name: 'Ari', you: false, presence: Presence.Here },
  { userId: `${SAMPLE_ID}sam`, name: 'Sam', you: false, presence: null },
  { userId: `${SAMPLE_ID}lou`, name: 'Lou', you: false, presence: Presence.Here },
];

const isSample = (id: string) => id.startsWith(SAMPLE_ID);

/**
 * Your real ternary with made-up friends mixed in, for trying the screens locally
 * (`sampleFriends`). Everything you do still goes to `repo` for real, except anything aimed
 * at a made-up friend, which is only remembered here. If the shared bird hasn't reached a
 * stop yet, it's shown at the second one so the table and postcards have something to show;
 * the ternary is marked `sample`, so no arrival bonus is paid for that.
 */
export function withSampleFriends(repo: TernaryRepository): TernaryRepository {
  let fishSent = 0;
  let fishDay = '';
  const blocked = new Set<string>();

  return {
    ...repo,
    async mine(today) {
      const real = await repo.mine(today);
      if (!real) return null;
      const sentToday = fishDay === today ? fishSent : 0;
      const total = Math.max(real.total, Milestones.STOPS[1].waypoints + 300);
      const stop = restingAt(total)?.id ?? `1-${Milestones.STOPS[1].id}`;
      const visible = (id: string) => !blocked.has(id);
      return {
        ...real,
        sample: true,
        total,
        members: [...real.members, ...SAMPLE_MEMBERS.filter((m) => visible(m.userId))],
        fish: [
          ...(visible(`${SAMPLE_ID}maya`)
            ? [{ id: `${SAMPLE_ID}fish-1`, fromName: 'Maya', day: today }]
            : []),
          ...real.fish,
        ],
        fishSentToday: real.fishSentToday + sentToday,
        postcards: [
          ...real.postcards,
          { id: `${SAMPLE_ID}card-1`, fromName: 'Maya', stopId: Milestones.STOPS[1].id, day: today, yours: false },
          { id: `${SAMPLE_ID}card-2`, fromName: 'Jo', stopId: Milestones.STOPS[0].id, day: addDays(today, -6), yours: false },
        ],
        dishes: [
          ...real.dishes,
          {
            id: `${SAMPLE_ID}dish-1`,
            fromName: 'Maya',
            fromId: `${SAMPLE_ID}maya`,
            stop,
            name: 'Red lentil soup',
            foods: ['Red lentils', 'Carrot', 'Onion', 'Cumin', 'Coconut milk', 'Lime'],
            yours: false,
          },
          {
            id: `${SAMPLE_ID}dish-2`,
            fromName: 'Jo',
            fromId: `${SAMPLE_ID}jo`,
            stop,
            name: 'Mulled cider',
            foods: ['Apple cider', 'Orange', 'Cinnamon', 'Cloves'],
            yours: false,
          },
          {
            id: `${SAMPLE_ID}dish-3`,
            fromName: 'Ari',
            fromId: `${SAMPLE_ID}ari`,
            stop: `1-${Milestones.STOPS[0].id}`,
            name: 'Sunday pancakes',
            foods: ['Flour', 'Eggs', 'Milk', 'Butter', 'Blueberries', 'Maple syrup'],
            yours: false,
          },
        ].filter((d) => visible(d.fromId)),
      };
    },
    async bringFish(toUserId, today) {
      if (!isSample(toUserId)) return repo.bringFish(toUserId, today);
      // The count is for one day: a new day starts it again.
      if (fishDay !== today) {
        fishDay = today;
        fishSent = 0;
      }
      if (fishSent >= TernaryRules.MAX_FISH_PER_DAY) {
        throw new Error('That’s all the fish for today');
      }
      fishSent += 1;
    },
    async block(userId) {
      if (isSample(userId)) blocked.add(userId);
      else await repo.block(userId);
    },
    async report(kind, target) {
      if (!isSample(target)) await repo.report(kind, target);
    },
  };
}
