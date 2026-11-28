import { cleanSpaces } from '@shared/utils/text';
import type {
  SavedMeal,
  SavedMealItem,
} from '../../saved-meals/models/savedMeals';
import { RouteId, Routes } from '../../waypoints/models/routes';

/** The route a ternary's shared bird flies: Greenland's unless it chose another. */
export const routeOf = (ternary: Pick<Ternary, 'route'>): RouteId =>
  Routes.of(ternary.route).id;

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
  /**
   * Which bird and colour they fly as (0 to `TernaryRules.LOOKS - 1`), chosen when they start
   * or join; never two the same in one ternary. See `FlockLooks`.
   */
  look: number;
};

/** A fish brought to you: kindness only, worth no waypoints. */
export type Fish = { id: string; fromName: string; day: string };

/** A postcard from a stop on a friend's own journey: never a date reached, a total or a pace. */
export type Postcard = {
  id: string;
  fromName: string;
  /** Who sent it, for its stamp; absent from an older server. */
  fromId?: string;
  /** A stop on the sender's own journey, with its lap ("2-iceland"); see `withLap`. */
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

/** A meal shared at a stop: its name and foods, and its recipe; nutrition is never shown. */
export type Dish = {
  id: string;
  fromName: string;
  fromId: string;
  /** The lap and stop the table was set at: "2-iceland". */
  stop: string;
  name: string;
  foods: string[];
  /**
   * The recipe, to save as your own meal: each food with its amount, nutrition included but
   * never shown in the ternary. Absent for meals shared by older builds.
   */
  items?: SavedMealItem[];
  /** How many servings the recipe makes. */
  servings?: number;
  yours: boolean;
};

/** A meal as it's shared: its name and foods, and its recipe. */
export type SharedMeal = Pick<Dish, 'name' | 'foods' | 'items' | 'servings'>;

export type Ternary = {
  id: string;
  name: string;
  inviteCode: string;
  /**
   * Which tracked migration the shared bird flies, chosen when the ternary was started. An
   * older server that doesn't say means Greenland's; read it through `Routes.of`.
   */
  route?: RouteId;
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
  /** Meals each person can share at one stop; the server holds to it too. */
  static readonly MAX_MEALS_PER_STOP = 5;
  /**
   * Arctic terns migrate in flocks of fewer than 15; a ternary stays well smaller, one bird
   * for each look. The server holds to it too (`20261128000000_ternary_looks`).
   */
  static readonly MAX_MEMBERS = 8;
  /** The birds to choose from, each its own pose and colour: one for everyone in a ternary. */
  static readonly LOOKS = 8;
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
  text
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, TernaryRules.INVITE_LENGTH);

/** A saved meal as it's shared: its name, its foods' names, and the recipe to save it from. */
export function dishFromSavedMeal(meal: SavedMeal): SharedMeal {
  return {
    name: meal.name,
    foods: [...new Set(meal.items.map((i) => i.name.trim()).filter(Boolean))],
    items: meal.items.map((i) => ({ ...i })),
    servings: meal.servings,
  };
}

/** Friends drawn in the flock today: everyone who's here or resting, you included. */
export const flock = (members: readonly TernaryMember[]) =>
  members.filter((m) => m.presence !== null);

/**
 * Who's in the flock today, each with their look: the bird and colour they chose, so the map,
 * the list and their postcards' stamps all agree on who's who.
 */
export const flockWithLooks = (members: readonly TernaryMember[]) =>
  members
    .filter((member) => member.presence !== null)
    .map((member) => ({ member, look: member.look }));

/** Looks someone other than you flies, so they can't be chosen. */
export const takenLooks = (members: readonly TernaryMember[]) =>
  new Set(members.filter((m) => !m.you).map((m) => m.look));

/**
 * `wanted` if nobody else flies it, otherwise the first free look: what a new member gets
 * when the one they chose is taken (they can't see which are before they join).
 */
export function freeLook(
  members: readonly TernaryMember[],
  wanted = 0,
): number {
  const taken = takenLooks(members);
  if (!taken.has(wanted)) return wanted;
  for (let look = 0; look < TernaryRules.LOOKS; look++) {
    if (!taken.has(look)) return look;
  }
  return wanted;
}

/** The friends you could bring a fish to: everyone but you. */
export const fishable = (members: readonly TernaryMember[]) =>
  members.filter((m) => !m.you);
