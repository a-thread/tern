import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { dayKey, msUntilMidnight } from '@shared/utils/date';

/**
 * Today's local date key, kept current: it flips at midnight while the app is
 * open, and re-checks when the app returns to the foreground (timers don't
 * run reliably while it's backgrounded).
 */
export function useDayKey(): string {
  const [key, setKey] = useState(() => dayKey());

  useEffect(() => {
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
  }, []);

  return key;
}
