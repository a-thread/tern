import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';
import LoadingBird from '@shared/components/LoadingBird';

/** The search is still running, or one of the food databases could not be reached. */
export function SearchStatus({
  loading,
  failedLabels,
  failedAll,
  onRetry,
}: {
  loading: boolean;
  failedLabels: string[];
  failedAll: boolean;
  onRetry: () => void;
}) {
  return (
    <>
      {loading ? (
        <View style={s.status}>
          <LoadingBird size={34} color={colors.ink3} label='Searching foods' />
          <Text style={s.statusText}>Searching…</Text>
        </View>
      ) : null}
      {failedLabels.length ? (
        <View style={s.errorCard}>
          <Text style={s.errorTitle}>
            {failedAll
              ? "Couldn't search the food databases"
              : `Couldn't reach ${failedLabels.join(' or ')}`}
          </Text>
          <Text style={s.statusText}>
            {failedAll
              ? 'Check your connection, or add the food yourself below.'
              : 'Showing what the other database found.'}
          </Text>
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text style={s.retry}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: space.lg,
  },
  statusText: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  errorCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    marginTop: space.md,
    gap: 4,
  },
  errorTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  retry: { fontFamily: font.semibold, fontSize: 13, color: colors.ink, marginTop: 6 },
});
