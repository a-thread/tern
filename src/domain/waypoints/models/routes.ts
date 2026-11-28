import { MigrationRoute, type RouteStop } from './migrationRoute';
import { NetherlandsRoute } from './netherlandsRoute';

/**
 * Which tracked migration a bird flies. Your own journey is always Greenland's; a ternary's
 * shared bird flies whichever its friends chose when they started it.
 */
export enum RouteId {
  Greenland = 'greenland',
  Netherlands = 'netherlands',
}

export type RouteInfo = {
  id: RouteId;
  /** As it's offered when starting a ternary: "The Greenland route". */
  name: string;
  /** One line on what makes it this route. */
  summary: string;
  stops: RouteStop[];
};

/** The routes there are, in the order they're offered. */
export class Routes {
  static readonly ALL: readonly RouteInfo[] = [
    {
      id: RouteId.Greenland,
      name: 'The Greenland route',
      summary:
        'Down the Atlantic to the Weddell Sea and back, about 71,000 km. The same route as your own journey.',
      stops: MigrationRoute.STOPS,
    },
    {
      id: RouteId.Netherlands,
      name: 'The Dutch route',
      summary:
        'Across three oceans to East Antarctica and back, about 90,000 km: the longest bird migration recorded.',
      stops: NetherlandsRoute.STOPS,
    },
  ];

  /** A route by id, falling back to Greenland's for one this version doesn't know. */
  static of(id: RouteId | string | undefined): RouteInfo {
    return Routes.ALL.find((r) => r.id === id) ?? Routes.ALL[0];
  }
}
