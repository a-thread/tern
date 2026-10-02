import React, { useCallback, useMemo, useState } from 'react';

import { useBackend } from '@shared/state/BackendContext';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { newId } from '@shared/utils/id';
import { useSettings } from '@settings/SettingsContext';
import { useAward } from '@journey/hooks/useAward';
import { dayTotal, isValidDrink, lastDrink, waterProgress, type WaterEntry } from '@water/models/waterEntry';

type WaterContextValue = {
  /** False until today's drinks have loaded once. */
  ready: boolean;
  /** Water tracking is switched on in Settings. */
  enabled: boolean;
  /** Millilitres drunk today. */
  totalOz: number;
  goalOz: number;
  /** 0 to 1 toward today's goal. */
  progress: number;
  reached: boolean;
  /** Logs a drink of `oz` ounces. False if it isn't a drink Tern can store. */
  addWater: (oz: number) => boolean;
  /** Removes today's most recent drink. */
  undoLast: () => void;
  /** Millilitres in the most recent drink today, for the Undo label. */
  lastOz: number | null;
};

const [WaterContext, useWater] = createRequiredContext<WaterContextValue>(
  'useWater',
  'WaterProvider',
);
export { useWater };

/** Today's water, and the waypoint for reaching the goal. Must sit inside SettingsProvider and WaypointsProvider. */
export function WaterProvider({ children }: { children: React.ReactNode }) {
  const { water: repo } = useBackend();
  const { settings } = useSettings();
  const today = useDayKey();

  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const { ready, reload } = useLoader(
    useCallback(() => repo.load(today, today), [repo, today]),
    setEntries,
    'Could not load water',
  );
  const persist = usePersist(reload);

  const enabled = settings.trackWater;
  const goalOz = settings.waterGoalOz;
  const totalOz = dayTotal(entries, today);
  const reached = goalOz > 0 && totalOz >= goalOz;

  // The waypoint follows the log, like "all meals": earned on reaching the goal, quietly
  // taken back if removing a drink drops the total below it. Nothing happens while tracking is off.
  useAward('water', reached, enabled && ready);

  const addWater = useCallback(
    (oz: number) => {
      const rounded = Math.round(oz * 100) / 100; // the database keeps hundredths of an ounce
      if (!isValidDrink(rounded)) return false;
      const entry: WaterEntry = {
        id: newId(),
        oz: rounded,
        loggedOn: today,
        loggedAt: new Date().toISOString(),
      };
      setEntries((prev) => [...prev, entry]);
      persist(repo.add(entry), {
        log: 'Could not save water',
        toast: "Couldn't save that drink — please try again.",
      });
      return true;
    },
    [repo, today, persist],
  );

  const last = lastDrink(entries, today);
  const lastId = last?.id;
  const undoLast = useCallback(() => {
    if (!lastId) return;
    setEntries((prev) => prev.filter((e) => e.id !== lastId));
    persist(repo.remove(lastId), {
      log: 'Could not remove water',
      toast: "Couldn't undo that — please try again.",
    });
  }, [lastId, repo, persist]);

  const value = useMemo<WaterContextValue>(
    () => ({
      ready,
      enabled,
      totalOz,
      goalOz,
      progress: waterProgress(totalOz, goalOz),
      reached,
      addWater,
      undoLast,
      lastOz: last?.oz ?? null,
    }),
    [ready, enabled, totalOz, goalOz, reached, addWater, undoLast, last?.oz],
  );

  return <WaterContext.Provider value={value}>{children}</WaterContext.Provider>;
}
