import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius } from '@shared/theme';
import { Group, GroupLabel, IconBadge, Row } from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { useUnits } from '@settings/hooks/useUnits';
import { formatMinutes } from '@settings/models/reminderPlan';
import { useMedication } from '@medication/MedicationContext';
import { useWater } from '@water/WaterContext';
import WaterSheet from '@water/components/WaterSheet';
import { formatLoggedAt } from '@weight/models/weightEntry';
import { useTodayItems } from '@today/hooks/useTodayItems';

/** What is still open today: meals, a weigh-in, water, a check-in and medication. Empty hides it. */
export function LeftToDoList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { openItems, lastWeight } = useTodayItems();
  const { formatWeight, formatVolume, quickWaterOz } = useUnits();
  const water = useWater();
  const { setTaken } = useMedication();
  const [waterOpen, setWaterOpen] = useState(false);

  if (!openItems.length) return null;
  return (
    <>
      <GroupLabel>Left to do</GroupLabel>
      <Group>
        {openItems.map((item) =>
          item.kind === 'water' ? (
            <Row
              key='water'
              title='Water'
              sub={`${formatVolume(item.totalOz)} of ${formatVolume(item.goalOz)}`}
              onPress={() => setWaterOpen(true)}
              icon={
                <IconBadge bg={colors.waterTint}>
                  <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                    <Path d='M12 3c-4 3-6 6-6 9a6 6 0 0 0 12 0c0-3-2-6-6-9z' stroke={colors.water} strokeWidth={2} />
                  </Svg>
                </IconBadge>
              }
              right={
                // Only the button logs a drink; tapping the row opens the water sheet, so a stray tap can't log one.
                <Pressable
                  onPress={() => water.addWater(quickWaterOz[0])}
                  hitSlop={8}
                  style={s.addBtn}
                  accessibilityRole='button'
                  accessibilityLabel={`Add ${formatVolume(quickWaterOz[0])} of water`}
                >
                  <Text style={s.markText}>{`+${formatVolume(quickWaterOz[0])}`}</Text>
                </Pressable>
              }
            />
          ) : item.kind === 'checkIn' ? (
            <Row
              key='check-in'
              title='Check in'
              sub='How are your mood and stress today?'
              onPress={() => navigation.navigate('CheckIn')}
              icon={
                <IconBadge bg={colors.violetTint}>
                  <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                    <Path
                      d='M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14.5s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9.5h.01M15 9.5h.01'
                      stroke={colors.violet}
                      strokeWidth={2}
                    />
                  </Svg>
                </IconBadge>
              }
              chevron
            />
          ) : item.kind === 'medication' ? (
            <Row
              key={`med-${item.medicationId}`}
              title={`Take ${item.name}`}
              sub={`Due ${formatMinutes(item.at)}`}
              onPress={() => setTaken(item.medicationId, true)}
              icon={
                <IconBadge bg={colors.violetTint}>
                  <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                    <Path
                      d='M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7zM8.5 8.5l7 7'
                      stroke={colors.violet}
                      strokeWidth={2}
                    />
                  </Svg>
                </IconBadge>
              }
              right={<Text style={s.markText}>Mark taken</Text>}
            />
          ) : item.kind === 'meal' ? (
            <Row
              key='meal'
              title={item.title}
              sub={item.sub}
              onPress={() => navigation.navigate('LogFood', { meal: item.meal })}
              icon={
                <IconBadge bg={colors.kelpTint}>
                  <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                    <Path d='M2,12 C6,6 14,6 18,12 C14,18 6,18 2,12 Z' stroke={colors.kelp} strokeWidth={2} />
                    <Path d='M18,12 L22,8.5 L22,15.5 Z' stroke={colors.kelp} strokeWidth={2} />
                  </Svg>
                </IconBadge>
              }
              chevron
            />
          ) : (
            <Row
              key='weight'
              title='Log weight'
              sub={
                lastWeight
                  ? `Last: ${formatWeight(lastWeight.lb)}, ${formatLoggedAt(lastWeight.loggedAt)}`
                  : 'No weight logged yet'
              }
              onPress={() => navigation.navigate('LogWeight')}
              icon={
                <IconBadge bg={colors.waterTint}>
                  <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
                    <Path
                      d='M6 5h12M9 5v2a3 3 0 1 0 6 0V5M7 19h10M9 19c0-4 1-6 3-7 2 1 3 3 3 7'
                      stroke={colors.water}
                      strokeWidth={2}
                    />
                  </Svg>
                </IconBadge>
              }
              chevron
            />
          ),
        )}
      </Group>
      <WaterSheet visible={waterOpen} onClose={() => setWaterOpen(false)} />
    </>
  );
}

const s = StyleSheet.create({
  markText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
  addBtn: {
    backgroundColor: colors.coralTint,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
