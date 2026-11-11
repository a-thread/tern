import { cleanSpaces } from '@shared/utils/text';
import type { SavedMeal } from '../../saved-meals/models/savedMeals';

/**
 * What a friend can see about you today. Absent (null) when you haven't shown up, or fly
 * privately: a quiet day and a private one look exactly the same.
 */
export enum Presence {
  Here = 'here',
  /** A rest day, shown as resting only when you share that; otherwise it's simply "here". */
  Resting = 'resting',
}

export type TernaryMember = {
  userId: string;
  /** The name they gave the ternary. */
  name: string;
  you: boolean;
  presence: Presence | null;
};

/** A fish brought to you: kindness only, worth no waypoints. */
export type Fish = { id: string; fromName: string; day: string };

/** A postcard from a stop on a friend's own journey: never a date reached, a total or a pace. */
export type Postcard = {
  id: string;
  fromName: string;
  /** A route stop's id (`MigrationRoute.STOPS`). */
  stopId: string;
  yours: boolean;
};

/** Someone you blocked, listed only to you so it can be undone. */
export type BlockedMember = { userId: string; name: string };

/** What a report is about: a shared recipe (its id) or a member (their user id). */
export enum ReportKind {
  Dish = 'dish',
  Member = 'member',
}

/** A dish at a stopover table: a name and its foods, never amounts, calories or levels. */
export type Dish = {
  id: string;
  fromName: string;
  fromId: string;
  /** The lap and stop the table was set at: "2-iceland". */
  stop: string;
  name: string;
  foods: string[];
  yours: boolean;
};

export type Ternary = {
  id: string;
  name: string;
  inviteCode: string;
  /** The shared bird's waypoints: settled days, plus the days still being counted. */
  total: number;
  members: TernaryMember[];
  /** Fish brought to you in the last few days, newest first. */
  fish: Fish[];
  fishSentToday: number;
  postcards: Postcard[];
  dishes: Dish[];
  /** Who you've blocked. Never who has blocked you. */
  blocked: BlockedMember[];
  flyPrivately: boolean;
  shareResting: boolean;
  /**
   * Shown with made-up friends on a local build (`withSampleFriends`): its total may be moved
   * on to open the table, so no arrival is paid for it.
   */
  sample?: boolean;
};

export enum JoinOutcome {
  Joined = 'joined',
  NotFound = 'not_found',
  Full = 'full',
  Already = 'already',
}

/** The numbers ternaries run on. Mirrored in the `20261111000000_ternaries` migration. */
export class TernaryRules {
  /** What the shared bird flies on a day everyone shows up: a lap in about a year. */
  static readonly SHOW_UP_POINTS = 75;
  /** Waypoints on your own journey when the shared bird reaches a stop. */
  static readonly ARRIVAL_POINTS = 25;
  /** The arrival bonus is paid at most this often, however fast a small ternary flies. */
  static readonly ARRIVAL_EVERY_DAYS = 7;
  static readonly MAX_FISH_PER_DAY = 3;
  /**
   * Arctic terns migrate in flocks of fewer than 15; a ternary stays well smaller.
   * Still open for the beta; the server never allows more than 14.
   */
  static readonly MAX_MEMBERS = 8;
  static readonly MAX_NAME_LENGTH = 40;
  static readonly INVITE_LENGTH = 6;
}

/** The shared bird's step for a day: 75 × the share of members who showed up. */
export function showUpPoints(showedUp: number, members: number): number {
  if (members <= 0) return 0;
  const share = Math.min(Math.max(showedUp, 0), members) / members;
  return Math.round(TernaryRules.SHOW_UP_POINTS * share);
}

/** A ternary or display name as stored: spaces tidied, capped; empty when only blank. */
export const cleanTernaryName = (text: string) =>
  cleanSpaces(text).slice(0, TernaryRules.MAX_NAME_LENGTH);

/** An invite code as typed: capitals, no spaces or dashes. */
export const cleanInviteCode = (text: string) =>
  text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, TernaryRules.INVITE_LENGTH);

/** A saved meal as it goes to a stopover table: its name and the foods' names, nothing else. */
export function dishFromSavedMeal(meal: SavedMeal): { name: string; foods: string[] } {
  return {
    name: meal.name,
    foods: [...new Set(meal.items.map((i) => i.name.trim()).filter(Boolean))],
  };
}

/** Friends drawn in the flock today: everyone who's here or resting, you included. */
export const flock = (members: readonly TernaryMember[]) =>
  members.filter((m) => m.presence !== null);

/**
 * Who's in the flock today, each with their look: which bird and colour they fly as on the
 * map. It's their place in the ternary (members come in the order they joined), so no two
 * friends share one and nobody's changes from day to day, whoever else shows up.
 */
export const flockWithLooks = (members: readonly TernaryMember[]) =>
  members
    .map((member, look) => ({ member, look }))
    .filter(({ member }) => member.presence !== null);

/** The friends you could bring a fish to: everyone but you. */
export const fishable = (members: readonly TernaryMember[]) =>
  members.filter((m) => !m.you);
