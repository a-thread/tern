import type { RouteId } from '../waypoints/models/routes';
import { hasSent } from './models/postcards';
import {
  freeLook,
  JoinOutcome,
  ReportKind,
  takenLooks,
  type Ternary,
  type TernaryMember,
  TernaryRules,
} from './models/ternary';
import { sampleTernary } from './ternary.mock';

/**
 * Ternaries: the caller's circle of friends, and what they can do in it. Only an account
 * with Tern Plus has one, so there's no on-phone version: everyone in a ternary is signed in.
 * `today` is the caller's local day (YYYY-MM-DD) throughout.
 */
export interface TernaryRepository {
  /** The caller's ternary as it stands today, or null when they're in none. */
  mine(today: string): Promise<Ternary | null>;
  /** Starts a ternary flying `route`, with you in it flying as `look`. */
  create(
    name: string,
    yourName: string,
    route: RouteId,
    look: number,
  ): Promise<void>;
  /** Joins as `look`, or the first free one if a friend already flies it. */
  join(code: string, yourName: string, look: number): Promise<JoinOutcome>;
  /** Changes the bird you fly as; false if someone else in the ternary flies it. */
  setLook(look: number): Promise<boolean>;
  leave(): Promise<void>;
  setPrivacy(privacy: {
    flyPrivately: boolean;
    shareResting: boolean;
  }): Promise<void>;
  bringFish(toUserId: string, today: string): Promise<void>;
  sendPostcard(stopId: string, today: string): Promise<void>;
  bringDish(
    stop: string,
    dish: { name: string; foods: string[] },
  ): Promise<void>;
  /** Silent: each stops seeing the other, and neither is told. */
  block(userId: string): Promise<void>;
  /** Undoes a block you made. */
  unblock(userId: string): Promise<void>;
  report(kind: ReportKind, target: string): Promise<void>;
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
  // Members you've blocked, kept so unblocking brings them back.
  const hidden = new Map<string, TernaryMember>();

  return {
    mine: async () => (current ? { ...current } : null),
    async create(name, yourName, route, look) {
      if (current) throw new Error('Already in a ternary');
      current = {
        id: id('ternary'),
        name,
        inviteCode: 'ABC234',
        route,
        total: 0,
        members: [
          { userId: 'you', name: yourName, you: true, presence: null, look },
        ],
        fish: [],
        fishSentToday: 0,
        postcards: [],
        dishes: [],
        blocked: [],
        flyPrivately: false,
        shareResting: false,
      };
    },
    async join(code, yourName, look) {
      if (current) return JoinOutcome.Already;
      const sample = sampleTernary('2026-01-01');
      if (code !== sample.inviteCode) return JoinOutcome.NotFound;
      const mine = freeLook(sample.members, look);
      current = {
        ...sampleTernary(new Date().toISOString().slice(0, 10)),
        members: sample.members.map((m) =>
          m.you ? { ...m, name: yourName, look: mine } : m,
        ),
      };
      return JoinOutcome.Joined;
    },
    async setLook(look) {
      const t = need();
      if (takenLooks(t.members).has(look)) return false;
      current = {
        ...t,
        members: t.members.map((m) => (m.you ? { ...m, look } : m)),
      };
      return true;
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
    async sendPostcard(stopId) {
      const t = need();
      if (hasSent(t.postcards, stopId)) return;
      current = {
        ...t,
        postcards: [
          {
            id: id('postcard'),
            fromName: 'You',
            fromId: 'you',
            stopId,
            yours: true,
          },
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
          {
            id: id('dish'),
            fromName: 'You',
            fromId: 'you',
            stop,
            yours: true,
            ...dish,
          },
        ],
      };
    },
    async block(userId) {
      const t = need();
      const member = t.members.find((m) => m.userId === userId && !m.you);
      if (!member) return;
      current = {
        ...t,
        members: t.members.filter((m) => m.userId !== userId),
        dishes: t.dishes.filter((d) => d.fromId !== userId),
        blocked: [...t.blocked, { userId, name: member.name }],
      };
      hidden.set(userId, member);
    },
    async unblock(userId) {
      const t = need();
      const member = hidden.get(userId);
      hidden.delete(userId);
      current = {
        ...t,
        members: member ? [...t.members, member] : t.members,
        blocked: t.blocked.filter((b) => b.userId !== userId),
      };
    },
    async report() {},
  };
}
