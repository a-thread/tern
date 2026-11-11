import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useLoader } from '@shared/hooks/useLoader';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useSettings } from '../settings/SettingsContext';
import { useWaypoints } from '../waypoints/WaypointsContext';
import { WaypointSource } from '../waypoints/models/waypoint';
import type { TernaryRepository } from './ternary.repository';
import { arrivalDue } from './models/stopover';
import {
  type JoinOutcome,
  type Ternary,
  TernaryRules,
} from './models/ternary';

type TernaryContextValue = {
  /** Ternaries can be used here: signed in with Tern Plus. */
  available: boolean;
  ready: boolean;
  /** The caller's ternary today, or null. */
  ternary: Ternary | null;
  /** Hidden for now (a break, not leaving): Journey shows nothing of it, and no arrival is paid. */
  hidden: boolean;
  reload: () => Promise<unknown>;
  create: (name: string, yourName: string) => Promise<void>;
  join: (code: string, yourName: string) => Promise<JoinOutcome>;
  leave: () => Promise<void>;
  setPrivacy: (privacy: { flyPrivately: boolean; shareResting: boolean }) => Promise<void>;
  bringFish: (toUserId: string) => Promise<void>;
  sendPostcard: (stopId: string) => Promise<void>;
  bringDish: (stop: string, dish: { name: string; foods: string[] }) => Promise<void>;
  block: (userId: string) => Promise<void>;
  report: (kind: 'dish' | 'member', target: string) => Promise<void>;
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
  const { settings, updateSettings } = useSettings();
  const { addWaypoints } = useWaypoints();
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
  useEffect(() => {
    if (total === undefined || hidden || sample) return;
    const due = arrivalDue(total, settings.ternaryArrival, today);
    if (JSON.stringify(due.seen) !== JSON.stringify(settings.ternaryArrival)) {
      updateSettings({ ternaryArrival: due.seen });
    }
    if (due.pay) addWaypoints(TernaryRules.ARRIVAL_POINTS, WaypointSource.Arrival);
    // Only a new total or a new day can bring an arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, today, hidden, sample]);

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
      create: then((name: string, yourName: string) => need().create(name, yourName)),
      join: then((code: string, yourName: string) => need().join(code, yourName)),
      leave: then(() => need().leave()),
      setPrivacy: then((p: { flyPrivately: boolean; shareResting: boolean }) =>
        need().setPrivacy(p),
      ),
      bringFish: then((to: string) => need().bringFish(to, today)),
      sendPostcard: then((stopId: string) => need().sendPostcard(stopId, today)),
      bringDish: then((stop: string, dish: { name: string; foods: string[] }) =>
        need().bringDish(stop, dish),
      ),
      block: then((userId: string) => need().block(userId)),
      report: (kind, target) => need().report(kind, target),
    };
  }, [repo, ready, ternary, hidden, reload, then, today]);

  return (
    <TernaryContext.Provider value={value}>{children}</TernaryContext.Provider>
  );
}
