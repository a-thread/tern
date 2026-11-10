import { addDays } from '@shared/utils/date';
import {
  JoinOutcome,
  Presence,
  type Ternary,
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
