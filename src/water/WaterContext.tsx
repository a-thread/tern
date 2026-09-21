import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useBackend } from '@shared/state/BackendContext';
import { useToast } from '@shared/state/ToastContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { newId } from '@shared/utils/id';
import { useSettings } from '@settings/SettingsContext';
import { useWaypoints } from '@journey/WaypointsContext';
import { waypointRules } from '@journey/models';
import { dayTotal, isValidDrink, lastDrink, waterProgress, type WaterEntry } from './models';

const WATER_POINTS = waypointRules.find((r) => r.id === 'water')?.points ?? 10;

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

const WaterContext = createContext<WaterContextValue | null>(null);

/** Today's water, and the waypoint for reaching the goal. Must sit inside SettingsProvider and WaypointsProvider. */
export function WaterProvider({ children }: { children: React.ReactNode }) {
  const { water: repo } = useBackend();
  const { settings } = useSettings();
  const { day: awardDay, addWaypoints, revokeWaypoints } = useWaypoints();
  const toast = useToast();
  const today = useDayKey();

  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const drinks = await repo.load(today, today);
      if (mounted.current) setEntries(drinks);
    } catch (e) {
      console.warn('Could not load water', e);
    }
  }, [repo, today]);

  useEffect(() => {
    mounted.current = true;
    reload().finally(() => mounted.current && setReady(true));
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const enabled = settings.trackWater;
  const goalOz = settings.waterGoalOz;
  const totalOz = dayTotal(entries, today);
  const reached = goalOz > 0 && totalOz >= goalOz;

  // The waypoint follows the log, like "all meals": earned on reaching the goal, quietly
  // taken back if removing a drink drops the total below it. Nothing happens while tracking is off.
  useEffect(() => {
    if (!enabled || !ready || awardDay !== today) return;
    if (reached) addWaypoints(WATER_POINTS, 'water');
    else revokeWaypoints(WATER_POINTS, 'water');
  }, [enabled, ready, awardDay, today, reached, addWaypoints, revokeWaypoints]);

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
      repo.add(entry).catch((e) => {
        console.warn('Could not save water', e);
        toast.show("Couldn't save that drink — please try again.");
        reload();
      });
      return true;
    },
    [repo, today, toast, reload],
  );

  const last = lastDrink(entries, today);
  const lastId = last?.id;
  const undoLast = useCallback(() => {
    if (!lastId) return;
    setEntries((prev) => prev.filter((e) => e.id !== lastId));
    repo.remove(lastId).catch((e) => {
      console.warn('Could not remove water', e);
      toast.show("Couldn't undo that — please try again.");
      reload();
    });
  }, [lastId, repo, toast, reload]);

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

export function useWater() {
  const ctx = useContext(WaterContext);
  if (!ctx) throw new Error('useWater must be used within WaterProvider');
  return ctx;
}
