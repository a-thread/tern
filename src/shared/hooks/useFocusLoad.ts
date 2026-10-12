import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Reads history each time the screen comes into focus (and whenever `deps` change), handing the
 * result to `apply` unless the screen has moved on. `deps` are the values `load` and `apply` use,
 * plus any trigger that should read again (a count that changes after logging, a refresh key).
 */
export function useFocusLoad<T>(
  load: () => Promise<T>,
  apply: (loaded: T) => void,
  deps: React.DependencyList,
  warning: string,
) {
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      load()
        .then((loaded) => !cancelled && apply(loaded))
        .catch((e) => console.warn(warning, e));
      return () => {
        cancelled = true;
      };
      // The caller lists everything `load` and `apply` read; the triggers are not inputs.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps),
  );
}
