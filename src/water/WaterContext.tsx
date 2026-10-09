import React, { useCallback, useMemo, useState } from 'react';

import type { WaterRepository } from '@water/data/water.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { atTimeOn } from '@shared/utils/date';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { newId } from '@shared/utils/id';
import { useSettings } from '@settings/SettingsContext';
import { useAward } from '@journey/hooks/useAward';
import { dayTotal, isValidDrink, lastDrink, waterProgress, type WaterEntry } from '@water/models/waterEntry';
import { WaypointSource } from '@journey/models/waypoint';

type WaterContextValue = {
  /** False until the drinks have loaded once. */
  ready: boolean;
  /** Reads everything again from storage (pull to refresh). */
  reload: () => Promise<unknown>;
  /** Water tracking is switched on in Settings. */
  enabled: boolean;
  /** Ounces drunk on the viewed day (today unless a past day is picked; see `useViewedDay`). */
  totalOz: number;
  goalOz: number;
  /** 0 to 1 toward today's goal. */
  progress: number;
  reached: boolean;
  /** Logs a drink of `oz` ounces on the viewed day. False if it isn't a drink Tern can store, or the day can't be edited. */
  addWater: (oz: number) => boolean;
  /** Removes the viewed day's most recent drink. */
  undoLast: () => void;
  /** Ounces in the viewed day's most recent drink, for the Undo label. */
  lastOz: number | null;
  /** The drinks logged from `from` to `to` inclusive (YYYY-MM-DD), for the Trends history. */
  loadRange: (from: string, to: string) => Promise<WaterEntry[]>;
};

const [WaterContext, useWater] = createRequiredContext<WaterContextValue>(
  'useWater',
  'WaterProvider',
);
export { useWater };

/** The viewed day's water, and the waypoint for reaching today's goal. Must sit inside SettingsProvider and WaypointsProvider. */
export function WaterProvider({
  repo,
  children,
}: {
  repo: WaterRepository;
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const today = useDayKey();
  const { day, editable } = useViewedDay();

  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loadedDay, setLoadedDay] = useState<string | null>(null);
  const { ready, reload } = useLoader(
    useCallback(async () => ({ day, entries: await repo.load(day, day) }), [repo, day]),
    (loaded) => {
      setEntries(loaded.entries);
      setLoadedDay(loaded.day);
    },
    'Could not load water',
  );
  const persist = usePersist(reload);

  const enabled = settings.trackWater;
  const goalOz = settings.waterGoalOz;
  const totalOz = dayTotal(entries, day);
  const reached = goalOz > 0 && totalOz >= goalOz;

  // The waypoint follows the log, like "all meals": earned on reaching the goal, quietly
  // taken back if removing a drink drops the total below it. Nothing happens while tracking is off,
  // or until today's drinks are the ones loaded (a past day's total says nothing about today's).
  useAward(WaypointSource.Water, reached, enabled && ready && loadedDay === today && day === today);

  const addWater = useCallback(
    (oz: number) => {
      const rounded = Math.round(oz * 100) / 100; // the database keeps hundredths of an ounce
      if (!editable || !isValidDrink(rounded)) return false;
      const entry: WaterEntry = {
        id: newId(),
        oz: rounded,
        loggedOn: day,
        loggedAt: day === today ? new Date().toISOString() : atTimeOn(day),
      };
      setEntries((prev) => [...prev, entry]);
      persist(repo.add(entry), {
        log: 'Could not save water',
        toast: "Couldn't save that drink — please try again.",
      });
      return true;
    },
    [repo, day, today, editable, persist],
  );

  const last = lastDrink(entries, day);
  const lastId = last?.id;
  const undoLast = useCallback(() => {
    if (!lastId || !editable) return;
    setEntries((prev) => prev.filter((e) => e.id !== lastId));
    persist(repo.remove(lastId), {
      log: 'Could not remove water',
      toast: "Couldn't undo that — please try again.",
    });
  }, [lastId, editable, repo, persist]);

  const loadRange = useCallback((from: string, to: string) => repo.load(from, to), [repo]);

  const value = useMemo<WaterContextValue>(
    () => ({
      ready,
      reload,
      enabled,
      totalOz,
      goalOz,
      progress: waterProgress(totalOz, goalOz),
      reached,
      addWater,
      undoLast,
      lastOz: last?.oz ?? null,
      loadRange,
    }),
    [ready, reload, enabled, totalOz, goalOz, reached, addWater, undoLast, last?.oz, loadRange],
  );

  return <WaterContext.Provider value={value}>{children}</WaterContext.Provider>;
}
