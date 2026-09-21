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
import { addDays } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useWaypoints } from '@journey/WaypointsContext';
import { waypointRules } from '@journey/models';
import { entryFor, isValidScore, type MoodEntry } from './models';

const MOOD_POINTS = waypointRules.find((r) => r.id === 'mood')?.points ?? 10;

/** How far back the context keeps check-ins: enough for the longest Trends range. */
export const HISTORY_DAYS = 180;

type MoodContextValue = {
  /** False until check-ins have loaded once. */
  ready: boolean;
  /** Mood and stress tracking is switched on in Settings. */
  enabled: boolean;
  /** The last 180 days of check-ins, oldest first. */
  entries: MoodEntry[];
  /** Today's check-in, if there is one. */
  today: MoodEntry | undefined;
  /** Saves today's check-in, replacing an earlier one. False if a score is off the scale. */
  checkIn: (mood: number, stress: number) => boolean;
  /** Removes today's check-in. */
  clearToday: () => void;
};

const MoodContext = createContext<MoodContextValue | null>(null);

/** Mood and stress check-ins, and the waypoint for checking in. Must sit inside SettingsProvider and WaypointsProvider. */
export function MoodProvider({ children }: { children: React.ReactNode }) {
  const { mood: repo } = useBackend();
  const { settings } = useSettings();
  const { day: awardDay, addWaypoints, revokeWaypoints } = useWaypoints();
  const toast = useToast();
  const today = useDayKey();

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const list = await repo.load(addDays(today, -(HISTORY_DAYS - 1)), today);
      if (mounted.current) setEntries(list);
    } catch (e) {
      console.warn('Could not load check-ins', e);
    }
  }, [repo, today]);

  useEffect(() => {
    mounted.current = true;
    reload().finally(() => mounted.current && setReady(true));
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const enabled = settings.trackMood;
  const todays = entryFor(entries, today);
  const checkedIn = todays !== undefined;

  // The waypoint follows the check-in, like the water goal: earned on checking in,
  // quietly taken back if today's check-in is removed. Nothing happens while tracking is off.
  useEffect(() => {
    if (!enabled || !ready || awardDay !== today) return;
    if (checkedIn) addWaypoints(MOOD_POINTS, 'mood');
    else revokeWaypoints(MOOD_POINTS, 'mood');
  }, [enabled, ready, awardDay, today, checkedIn, addWaypoints, revokeWaypoints]);

  const checkIn = useCallback(
    (mood: number, stress: number) => {
      if (!isValidScore(mood) || !isValidScore(stress)) return false;
      const entry: MoodEntry = { day: today, mood, stress };
      setEntries((prev) => [...prev.filter((e) => e.day !== today), entry]);
      repo.save(entry).catch((e) => {
        console.warn('Could not save check-in', e);
        toast.show("Couldn't save your check-in — please try again.");
        reload();
      });
      return true;
    },
    [repo, today, toast, reload],
  );

  const clearToday = useCallback(() => {
    setEntries((prev) => prev.filter((e) => e.day !== today));
    repo.remove(today).catch((e) => {
      console.warn('Could not remove check-in', e);
      toast.show("Couldn't undo that — please try again.");
      reload();
    });
  }, [repo, today, toast, reload]);

  const value = useMemo<MoodContextValue>(
    () => ({ ready, enabled, entries, today: todays, checkIn, clearToday }),
    [ready, enabled, entries, todays, checkIn, clearToday],
  );

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error('useMood must be used within MoodProvider');
  return ctx;
}
