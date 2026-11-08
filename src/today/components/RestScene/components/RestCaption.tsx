import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';

/** A link at the end of the note, to where the thing it mentions can be changed. */
export type NoteLink = { label: string; onPress: () => void };

/**
 * The words under the rest scene: its title, what the day means, the steps, and an optional note
 * (with a link after it, when there is somewhere to change what it says).
 */
export function RestCaption({
  title,
  line,
  detail,
  note,
  noteLink,
}: {
  title: string;
  line: string;
  detail: string;
  note?: string;
  noteLink?: NoteLink;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name='weather-sunset' size={16} color={colors.glacier} />
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <Text style={styles.lineText}>{line}</Text>
      {detail ? <Text style={styles.detailText}>{detail}</Text> : null}

      {note ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{note}</Text>
          {noteLink ? (
            <>
              <Text style={styles.noteText}> · </Text>
              <Pressable
                onPress={noteLink.onPress}
                hitSlop={8}
                accessibilityRole='button'
                accessibilityLabel={noteLink.label}
              >
                <Text style={styles.linkText}>{`${noteLink.label} ›`}</Text>
              </Pressable>
            </>
          ) : null}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  // A status line, not part of the day's story: the body face, not the display serif.
  noteText: { ...typography.meta, color: colors.ink3 },
  linkText: {
    ...typography.meta,
    fontFamily: font.semibold,
    color: colors.coral,
  },
});
