import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { dayKey, msUntilMidnight } from '../utils/date';

const DayKeyContext = createContext<string | null>(null);

/** Keeps the day key current while enabled. */
function useTrackedDayKey(enabled: boolean): string {
  const [key, setKey] = useState(() => dayKey());

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      // A second of slack so the timer never fires just before midnight.
      timer = setTimeout(() => {
        setKey(dayKey());
        schedule();
      }, msUntilMidnight() + 1000);
    };
    schedule();

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setKey(dayKey());
      clearTimeout(timer);
      schedule();
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [enabled]);

  return key;
}

/** One midnight timer and AppState listener for the whole app. */
export function DayKeyProvider({ children }: { children: React.ReactNode }) {
  const key = useTrackedDayKey(true);
  return (
    <DayKeyContext.Provider value={key}>{children}</DayKeyContext.Provider>
  );
}

/** Tracks it on its own without a provider (tests). */
export function useDayKey(): string {
  const shared = useContext(DayKeyContext);
  const own = useTrackedDayKey(shared === null);
  return shared ?? own;
}
