import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { shouldReplay, type LastPlay } from './replayPolicy';

/** Returns a key for replaying entrance animations when the screen regains focus. */
export function useReplayOnFocus(value: number): number {
  const [replayKey, setReplayKey] = useState(0);
  const last = useRef<LastPlay | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (shouldReplay(last.current, now, valueRef.current)) {
        last.current = { at: now, value: valueRef.current };
        setReplayKey((k) => k + 1);
      }
    }, []),
  );

  return replayKey;
}
