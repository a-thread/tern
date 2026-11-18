import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tern:waypoints:last-seen';

/** `lastSeen`: undefined while reading, null if never opened or unreadable. */
export function useLastSeenTotal(): {
  lastSeen: number | null | undefined;
  remember: (total: number) => void;
} {
  const [lastSeen, setLastSeen] = useState<number | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const n = raw === null ? NaN : Number(raw);
        if (alive) setLastSeen(Number.isFinite(n) ? n : null);
      })
      .catch(() => alive && setLastSeen(null));
    return () => {
      alive = false;
    };
  }, []);

  const remember = useCallback((total: number) => {
    AsyncStorage.setItem(KEY, String(total)).catch(() => {});
  }, []);

  return { lastSeen, remember };
}
