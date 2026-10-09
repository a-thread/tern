import React, { useCallback, useMemo, useState } from 'react';

import type { MoodRepository } from '@mood/data/mood.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { addDays } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useAward } from '@journey/hooks/useAward';
import { entryFor } from '@mood/models/moodStats';
import { isValidScore, type MoodEntry } from '@mood/models/moodEntry';
import { WaypointSource } from '@journey/models/waypoint';

/** How far back the context keeps check-ins: enough for the longest Trends range. */
export const HISTORY_DAYS = 180;

type MoodContextValue = {
  /** False until check-ins have loaded once. */
  ready: boolean;
  /** Reads everything again from storage (pull to refresh). */
  reload: () => Promise<unknown>;
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

const [MoodContext, useMood] = createRequiredContext<MoodContextValue>('useMood', 'MoodProvider');
export { useMood };

/** Mood and stress check-ins, and the waypoint for checking in. Must sit inside SettingsProvider and WaypointsProvider. */
export function MoodProvider({
  repo,
  children,
}: {
  repo: MoodRepository;
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const today = useDayKey();

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const { ready, reload } = useLoader(
    useCallback(() => repo.load(addDays(today, -(HISTORY_DAYS - 1)), today), [repo, today]),
    setEntries,
    'Could not load check-ins',
  );
  const persist = usePersist(reload);

  const enabled = settings.trackMood;
  const todays = entryFor(entries, today);
  const checkedIn = todays !== undefined;

  // The waypoint follows the check-in, like the water goal: earned on checking in,
  // quietly taken back if today's check-in is removed. Nothing happens while tracking is off.
  useAward(WaypointSource.Mood, checkedIn, enabled && ready);

  const checkIn = useCallback(
    (mood: number, stress: number) => {
      if (!isValidScore(mood) || !isValidScore(stress)) return false;
      const entry: MoodEntry = { day: today, mood, stress };
      setEntries((prev) => [...prev.filter((e) => e.day !== today), entry]);
      persist(repo.save(entry), {
        log: 'Could not save check-in',
        toast: "Couldn't save your check-in — please try again.",
      });
      return true;
    },
    [repo, today, persist],
  );

  const clearToday = useCallback(() => {
    setEntries((prev) => prev.filter((e) => e.day !== today));
    persist(repo.remove(today), {
      log: 'Could not remove check-in',
      toast: "Couldn't undo that — please try again.",
    });
  }, [repo, today, persist]);

  const value = useMemo<MoodContextValue>(
    () => ({ ready, reload, enabled, entries, today: todays, checkIn, clearToday }),
    [ready, reload, enabled, entries, todays, checkIn, clearToday],
  );

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}
