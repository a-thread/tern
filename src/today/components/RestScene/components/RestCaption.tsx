import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { Icon } from '@shared/components/ui';

/** The words under the rest scene: its title, what the day means, the steps, and an optional note. */
export function RestCaption({
  title,
  line,
  detail,
  note,
}: {
  title: string;
  line: string;
  detail: string;
  note?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name='weather-sunset' size={16} color={colors.glacier} />
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <Text style={styles.lineText}>{line}</Text>
      <Text style={styles.detailText}>{detail}</Text>

      {note ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{note}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: space.lg,
    paddingHorizontal: space.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.xs,
  },
  titleText: {
    fontFamily: font.display,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.ink3,
  },
  lineText: {
    fontFamily: font.displayMedium,
    fontSize: 18,
    color: colors.ink,
    lineHeight: 24,
    marginBottom: space.xs,
  },
  detailText: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 20,
  },
  noteBox: {
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  noteText: {
    fontFamily: font.displayMedium,
    fontSize: 12,
    color: colors.ink3,
  },
});
