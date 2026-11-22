import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** On focus and on `deps` change; a stale read is dropped. Include any re-read trigger in `deps`. */
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
