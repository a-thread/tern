import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tern:waypoints:last-seen';

/**
 * The waypoint total the last time the waypoints card was open, kept on this phone, so the
 * card can show how far you've come since you last looked. `lastSeen` is undefined while it's
 * read, and null when the card has never been opened (or storage can't be read).
 */
export function useLastSeenTotal(): {
  lastSeen: number | null | undefined;
  remember: (total: number) => void;
} {
  const [lastSeen, setLastSeen] = useState<number | null | undefined>(undefined);

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
