import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, radius } from '@shared/theme';
import { Group, GroupLabel, IconBadge, Row, Icon } from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { useUnits } from '@settings/hooks/useUnits';
import { formatMinutes } from '@settings/models/reminderPlan';
import { useMedication } from '@medication/MedicationContext';
import { useWater } from '@water/WaterContext';
import WaterSheet from '@water/components/WaterSheet';
import { formatLoggedAt } from '@weight/models/weightEntry';
import { useDayItems } from '@today/hooks/useDayItems';

/**
 * What is still open on the viewed day: meals, a weigh-in, water, a check-in and (today only)
 * medication. Yesterday can still be filled in; earlier days have nothing open. Empty hides it.
 */
export function LeftToDoList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { openItems, lastWeight, isToday } = useDayItems();
  const { formatWeight, formatVolume, quickWaterOz } = useUnits();
  const water = useWater();
  const { setTaken } = useMedication();
  const [waterOpen, setWaterOpen] = useState(false);

  if (!openItems.length) return null;
  return (
    <>
      <GroupLabel>{isToday ? 'Left to do' : 'Left from yesterday'}</GroupLabel>
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
                  <Icon name='water-outline' size={16} color={colors.water} />
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
              sub={`${isToday ? 'How are your mood and stress today' : 'How were your mood and stress yesterday'}?`}
              onPress={() => navigation.navigate('CheckIn')}
              icon={
                <IconBadge bg={colors.violetTint}>
                  <Icon name='emoticon-happy-outline' size={16} color={colors.violet} />
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
                  <Icon name='pill' size={16} color={colors.violet} />
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
                  <Icon name='silverware-fork-knife' size={16} color={colors.kelp} />
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
                  <Icon name='scale-bathroom' size={16} color={colors.water} />
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
