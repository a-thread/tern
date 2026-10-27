import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon, type IconName } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { WizardStep as Step } from '../models/wizardSteps';

/** Calories or no numbers: the same choice as Settings › Food display. */
export default function FoodStyleScreen() {
  const { settings, updateSettings } = useSettings();
  const withNumbers = settings.trackCalories && settings.showCalories;

  return (
    <WizardStep
      step={Step.FoodStyle}
      title='How do you like food logged?'
      body='Either way, logging every meal counts the same.'
    >
      <View style={s.options} accessibilityRole='radiogroup'>
        <Choice
          icon='counter'
          title='With calories'
          sub='Totals against a daily target you can change'
          selected={withNumbers}
          onPress={() =>
            updateSettings({ trackCalories: true, showCalories: true })
          }
        />
        <Choice
          icon='silverware-fork-knife'
          title='Without numbers'
          sub='Just what you ate and when'
          selected={!withNumbers}
          onPress={() => updateSettings({ showCalories: false })}
        />
      </View>
    </WizardStep>
  );
}

function Choice({
  icon,
  title,
  sub,
  selected,
  onPress,
}: {
  icon: IconName;
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.choice, selected && s.choiceOn]}
      accessibilityRole='radio'
      accessibilityState={{ selected }}
    >
      <View style={[s.badge, selected && s.badgeOn]}>
        <Icon
          name={icon}
          size={20}
          color={selected ? colors.card : colors.kelp}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={typography.rowTitle}>{title}</Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
      {/* A radio mark too, so the choice isn't shown by colour alone. */}
      <View style={[s.radio, selected && s.radioOn]}>
        {selected ? <View style={s.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  options: { gap: space.sm, marginTop: space.lg },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  choiceOn: { borderColor: colors.kelp, backgroundColor: colors.kelpTint },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.kelpTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: { backgroundColor: colors.kelp },
  sub: { ...typography.caption, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.dove,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.kelp },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.kelp,
  },
});
