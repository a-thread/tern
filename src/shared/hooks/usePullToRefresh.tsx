import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { colors } from '@shared/theme';

/**
 * Pull to refresh for a ScrollView: pass the result as its `refreshControl`.
 *
 * Pulling runs every `refreshers` at once and the spinner stays until all have
 * settled. A refresher that fails is ignored (each one logs its own failure),
 * and a pull while one is already running does nothing.
 */
export function usePullToRefresh(
  refreshers: readonly (() => Promise<unknown>)[],
): React.ReactElement<React.ComponentProps<typeof RefreshControl>> {
  const [refreshing, setRefreshing] = useState(false);
  const running = useRef(false);
  const mounted = useRef(true);
  const latest = useRef(refreshers);
  latest.current = refreshers;

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const onRefresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setRefreshing(true);
    try {
      await Promise.allSettled(latest.current.map((refresh) => refresh()));
    } finally {
      running.current = false;
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.coral}
      colors={[colors.coral]}
      progressBackgroundColor={colors.paper}
    />
  );
}
