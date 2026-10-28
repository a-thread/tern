import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useWizard } from '../../hooks/useWizard';
import { WizardStep as Step } from '../../models/wizardSteps';

type Action = { label: string; onPress: () => void };

/**
 * The frame every wizard screen shares: a back arrow (after the first screen), progress dots
 * and a skip link at the top, a title and
 * body, the screen's own controls, then the main button and an optional quieter link under it.
 * `skip` defaults to "Skip", which keeps this screen's defaults and moves on; pass null for none.
 */
export function WizardStep({
  step,
  title,
  body,
  children,
  primary,
  secondary,
  tertiary,
  skip,
  center,
  hero,
}: {
  step: Step;
  title: string;
  body?: string;
  children?: React.ReactNode;
  primary?: Action;
  secondary?: Action;
  /** A second quiet link under the first. */
  tertiary?: Action;
  skip?: Action | null;
  /** Centre everything on the screen, top to bottom (the welcome screen). */
  center?: boolean;
  /** Shown above the title, e.g. the welcome screen's mark. */
  hero?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const wizard = useWizard(step);
  const topAction =
    skip === undefined ? { label: 'Skip', onPress: wizard.next } : skip;
  const main = primary ?? { label: 'Next', onPress: wizard.next };

  return (
    <View
      style={[
        s.root,
        {
          paddingTop: insets.top + space.sm,
          paddingBottom: insets.bottom + space.md,
        },
      ]}
    >
      <View style={s.top}>
        <View style={s.lead}>
          {wizard.back ? (
            <Pressable
              onPress={wizard.back}
              hitSlop={12}
              accessibilityRole='button'
              accessibilityLabel='Back'
            >
              <Icon name='chevron-left' size={24} color={colors.ink2} />
            </Pressable>
          ) : null}
          <View
            style={s.dots}
            accessible
            accessibilityLabel={`Step ${wizard.index + 1} of ${wizard.steps.length}`}
          >
            {wizard.steps.map((st, i) => (
              <View
                key={st}
                style={[
                  s.dot,
                  i < wizard.index && s.dotDone,
                  i === wizard.index && s.dotOn,
                ]}
              />
            ))}
          </View>
        </View>
        {topAction ? (
          <Pressable
            onPress={topAction.onPress}
            hitSlop={10}
            accessibilityRole='button'
          >
            <Text style={s.skip}>{topAction.label}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[s.content, center && s.contentCentered]}
        keyboardShouldPersistTaps='handled'
      >
        {hero}
        <Text
          style={[s.title, center && s.centered]}
          accessibilityRole='header'
        >
          {title}
        </Text>
        {body ? (
          <Text style={[s.body, center && s.centered]}>{body}</Text>
        ) : null}
        {children}
      </ScrollView>

      <Pressable
        onPress={main.onPress}
        style={s.primary}
        accessibilityRole='button'
      >
        <Text style={s.primaryText}>{main.label}</Text>
      </Pressable>
      {[secondary, tertiary].map((link) =>
        link ? (
          <Pressable
            key={link.label}
            onPress={link.onPress}
            hitSlop={8}
            style={s.secondary}
            accessibilityRole='button'
          >
            <Text style={s.secondaryText}>{link.label}</Text>
          </Pressable>
        ) : null,
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: space.lg,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  lead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dots: { flexDirection: 'row', gap: 5 },
  // Done steps stay tinted, so the dots read as progress rather than a row of equals.
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dove },
  dotDone: { backgroundColor: colors.coralTint },
  dotOn: { width: 22, backgroundColor: colors.coral },
  skip: { fontFamily: font.medium, fontSize: 14, color: colors.ink2 },
  content: { paddingTop: space.xl, paddingBottom: space.lg },
  contentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: space.xxl,
  },
  title: {
    ...typography.screenTitle,
    fontSize: 26,
    lineHeight: 32,
  },
  body: {
    ...typography.meta,
    lineHeight: 19,
    marginTop: space.sm,
  },
  centered: { textAlign: 'center' },
  primary: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { fontFamily: font.semibold, fontSize: 15, color: '#fff' },
  secondary: { alignItems: 'center', paddingTop: space.md },
  secondaryText: {
    fontFamily: font.medium,
    fontSize: 13.5,
    color: colors.ink2,
  },
});
