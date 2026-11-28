import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useLoader } from '@shared/hooks/useLoader';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useSettings } from '../settings/SettingsContext';
import { useWaypoints } from '../waypoints/WaypointsContext';
import { WaypointSource } from '../waypoints/models/waypoint';
import { RouteId } from '../waypoints/models/routes';
import type { TernaryRepository } from './ternary.repository';
import { arrivalDue } from './models/stopover';
import {
  type JoinOutcome,
  type ReportKind,
  routeOf,
  type Ternary,
  TernaryRules,
} from './models/ternary';

type TernaryContextValue = {
  /** Ternaries can be used here: signed in with Tern Plus. */
  available: boolean;
  ready: boolean;
  /** The caller's ternary today, or null. */
  ternary: Ternary | null;
  /**
   * Hidden for now (a break, not leaving): Journey shows only a row to bring it back. No
   * arrival is paid meanwhile; a stop reached during the break pays once it's shown again.
   */
  hidden: boolean;
  reload: () => Promise<unknown>;
  create: (
    name: string,
    yourName: string,
    route: RouteId,
    look: number,
  ) => Promise<void>;
  /** Joins as `look`, or the first free bird if a friend already flies it. */
  join: (code: string, yourName: string, look: number) => Promise<JoinOutcome>;
  /** Changes the bird you fly as; false if a friend already flies it. */
  setLook: (look: number) => Promise<boolean>;
  leave: () => Promise<void>;
  setPrivacy: (privacy: {
    flyPrivately: boolean;
    shareResting: boolean;
  }) => Promise<void>;
  bringFish: (toUserId: string) => Promise<void>;
  sendPostcard: (stopId: string) => Promise<void>;
  bringDish: (
    stop: string,
    dish: { name: string; foods: string[] },
  ) => Promise<void>;
  removeDish: (dishId: string) => Promise<void>;
  block: (userId: string) => Promise<void>;
  unblock: (userId: string) => Promise<void>;
  report: (kind: ReportKind, target: string) => Promise<void>;
};

const [TernaryContext, useTernary] = createRequiredContext<TernaryContextValue>(
  'useTernary',
  'TernaryProvider',
);
export { useTernary };

/**
 * The signed-in person's ternary. App-wide, since both Journey (the tab) and the ternary's own
 * screens (in the root stack) read it. Without `repo` (on the phone, with no account) there's
 * nothing to load and `available` is false.
 *
 * Pays the arrival bonus: when the shared bird reaches a new stop, 25 waypoints on the
 * person's own journey, at most once a week (`arrivalDue`).
 */
export function TernaryProvider({
  repo,
  children,
}: {
  repo?: TernaryRepository;
  children: React.ReactNode;
}) {
  const today = useDayKey();
  const { settings, ready: settingsReady, updateSettings } = useSettings();
  const { addWaypoints, ready: waypointsReady } = useWaypoints();
  const [ternary, setTernary] = useState<Ternary | null>(null);

  const { ready, reload } = useLoader(
    useCallback(async () => (repo ? repo.mine(today) : null), [repo, today]),
    setTernary,
    'Could not load your ternary',
  );

  const hidden = settings.hideTernary;
  const total = ternary?.total;
  // With sample friends the total may be moved on to show the table: never paid, or remembered.
  const sample = Boolean(ternary?.sample);
  const route = ternary ? routeOf(ternary) : RouteId.Greenland;
  const ternaryId = ternary?.id;
  // This provider sits above LoadGate, so the ternary can arrive before settings and the
  // ledger do: until both have loaded, the remembered arrival and the break aren't known.
  const loaded = settingsReady && waypointsReady;
  useEffect(() => {
    if (!loaded || total === undefined || hidden || sample) return;
    const due = arrivalDue(
      total,
      settings.ternaryArrival,
      today,
      route,
      ternaryId,
    );
    if (JSON.stringify(due.seen) !== JSON.stringify(settings.ternaryArrival)) {
      updateSettings({ ternaryArrival: due.seen });
    }
    if (due.pay)
      addWaypoints(TernaryRules.ARRIVAL_POINTS, WaypointSource.Arrival);
    // Only a new total, a new day or another ternary can bring an arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, total, today, hidden, sample, route, ternaryId]);

  const then = useCallback(
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A): Promise<R> => {
        const result = await fn(...args);
        await reload();
        return result;
      },
    [reload],
  );

  const value = useMemo<TernaryContextValue>(() => {
    const need = () => {
      if (!repo) throw new Error('Ternaries need an account with Tern Plus');
      return repo;
    };
    return {
      available: Boolean(repo),
      ready,
      ternary,
      hidden,
      reload,
      create: then(
        (name: string, yourName: string, route: RouteId, look: number) =>
          need().create(name, yourName, route, look),
      ),
      join: then((code: string, yourName: string, look: number) =>
        need().join(code, yourName, look),
      ),
      setLook: then((look: number) => need().setLook(look)),
      // A break belongs to the ternary it was taken from: the next one starts shown.
      leave: then(async () => {
        await need().leave();
        if (hidden) updateSettings({ hideTernary: false });
      }),
      setPrivacy: then((p: { flyPrivately: boolean; shareResting: boolean }) =>
        need().setPrivacy(p),
      ),
      bringFish: then((to: string) => need().bringFish(to, today)),
      sendPostcard: then((stopId: string) =>
        need().sendPostcard(stopId, today),
      ),
      bringDish: then((stop: string, dish: { name: string; foods: string[] }) =>
        need().bringDish(stop, dish),
      ),
      removeDish: then((dishId: string) => need().removeDish(dishId)),
      block: then((userId: string) => need().block(userId)),
      unblock: then((userId: string) => need().unblock(userId)),
      report: (kind, target) => need().report(kind, target),
    };
  }, [repo, ready, ternary, hidden, reload, then, today, updateSettings]);

  return (
    <TernaryContext.Provider value={value}>{children}</TernaryContext.Provider>
  );
}
