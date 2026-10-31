import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, space, typography } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
} from '@shared/components/ui';
import { useActivity } from '../../domain/activity/ActivityContext';
import { suggestGoal } from '../../domain/activity/models/stepGoal';
import { StepGoal } from '../../domain/settings/models/stepGoalHistory';
import { useSettings } from '../../domain/settings/SettingsContext';
import { StepGoalSlider } from '@shared/components/StepGoalSlider/StepGoalSlider';

const MIN = StepGoal.MIN;
const MAX = StepGoal.MAX;

export default function StepGoalScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { days } = useActivity();

  const recent = days.slice(-30).filter((d) => d.steps > 0);
  const goalDays = recent.filter((d) => d.steps >= d.goal).length;
  const movedDays = recent.filter((d) => d.movedToGoal).length;
  const average = recent.length
    ? Math.round(recent.reduce((sum, d) => sum + d.steps, 0) / recent.length)
    : null;
  const suggestion = settings.suggestStepAdjustments
    ? suggestGoal(days, settings.stepGoal)
    : null;

  const setGoal = (v: number) =>
    updateSettings({
      stepGoal: Math.round(Math.min(Math.max(v, MIN), MAX) / 100) * 100,
    });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Step goal'
        backLabel='Back'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <StepGoalSlider />

        <GroupLabel>Based on your history</GroupLabel>
        <View style={s.card}>
          {average !== null && recent.length >= 3 ? (
            <Text style={s.historyText}>
              You've averaged{' '}
              <Text style={s.bold}>{average.toLocaleString()} steps</Text> over
              the last {recent.length} days with step data, and reached your
              goal on {goalDays} of them
              {movedDays > 0
                ? `, with ${movedDays} more made goal days by movement.`
                : '.'}
            </Text>
          ) : (
            <Text style={s.historyText}>
              Once Tern has a few days of steps, your history shows up here.
            </Text>
          )}
        </View>

        <GroupLabel>Adjusting</GroupLabel>
        <Group>
          <ToggleRow
            title='Suggest adjustments'
            sub='Tern can suggest a new goal from your last 30 days of steps'
            on={settings.suggestStepAdjustments}
            onToggle={(v) => updateSettings({ suggestStepAdjustments: v })}
          />
        </Group>

        {suggestion !== null ? (
          <View style={[s.card, { marginTop: space.md }]}>
            <Text style={s.historyText}>
              {suggestion < settings.stepGoal
                ? `Most days land below ${settings.stepGoal.toLocaleString()}. A goal of ${suggestion.toLocaleString()} might feel more reachable.`
                : `You've reached your goal on nearly every day lately. ${suggestion.toLocaleString()} is there if you want a bit more. Staying put is fine too.`}
            </Text>
            <Text style={s.suggestLink} onPress={() => setGoal(suggestion)}>
              Use {suggestion.toLocaleString()}
            </Text>
          </View>
        ) : null}

        <Text style={s.footNote}>
          Changing your goal never changes past days. Pick one you can hit most
          days.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  suggestLink: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
    marginTop: space.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  historyText: { ...typography.meta, lineHeight: 19 },
  bold: { fontFamily: font.semibold, color: colors.ink },
  footNote: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 17,
    color: colors.ink3,
    paddingHorizontal: space.sm,
    paddingTop: space.md,
  },
});
