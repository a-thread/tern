import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useDayKey } from '@shared/hooks/useDayKey';
import { isTodayOrYesterday } from '@shared/utils/date';

export type ViewedDay = {
  /** The day Home and Food are showing (YYYY-MM-DD). */
  day: string;
  /** The real today. */
  today: string;
  isToday: boolean;
  /** Today and yesterday can still be filled in; earlier days are read-only. */
  editable: boolean;
  /** Look at `day` instead. A day after today is ignored. */
  setDay: (day: string) => void;
  /** Back to today. */
  showToday: () => void;
};

const ViewedDayContext = createContext<ViewedDay | null>(null);

/**
 * The day being looked at, shared by Home and Food: pick Tuesday in the week
 * strip and the Food tab shows Tuesday too. It goes back to today when the app
 * leaves the screen and when the date changes, so the app always opens on today.
 */
export function ViewedDayProvider({ children }: { children: React.ReactNode }) {
  const today = useDayKey();
  const [picked, setPicked] = useState<string | null>(null);

  // A new day starts on today.
  useEffect(() => setPicked(null), [today]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') setPicked(null);
    });
    return () => sub.remove();
  }, []);

  const setDay = useCallback(
    (day: string) => setPicked(day >= today ? null : day),
    [today],
  );
  const showToday = useCallback(() => setPicked(null), []);

  const value = useMemo(() => viewedDay(picked ?? today, today, setDay, showToday), [
    picked,
    today,
    setDay,
    showToday,
  ]);
  return <ViewedDayContext.Provider value={value}>{children}</ViewedDayContext.Provider>;
}

const noop = () => {};

function viewedDay(
  day: string,
  today: string,
  setDay: (day: string) => void,
  showToday: () => void,
): ViewedDay {
  return {
    day,
    today,
    isToday: day === today,
    editable: isTodayOrYesterday(day, today),
    setDay,
    showToday,
  };
}

/** The day being looked at. Without a provider (tests, isolated screens) it is always today. */
export function useViewedDay(): ViewedDay {
  const shared = useContext(ViewedDayContext);
  const today = useDayKey();
  return useMemo(() => shared ?? viewedDay(today, today, noop, noop), [shared, today]);
}
