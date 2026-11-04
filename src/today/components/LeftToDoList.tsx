import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius } from '@shared/theme';
import { Group, GroupLabel, IconBadge, Row, Icon } from '@shared/components/ui';
import { useUnits } from '../../domain/settings/hooks/useUnits';
import { formatMinutes } from '../../domain/settings/models/reminderPlan';
import { useMedication } from '../../domain/medication/MedicationContext';
import { WaterTodoRow } from './WaterTodoRow/WaterTodoRow';
import { formatLoggedAt } from '../../domain/weight/models/weightEntry';
import { useDayItems } from '../hooks/useDayItems';
import { useRootNavigation } from '../../navigation/useAppNavigation';

/**
 * What is still open on the viewed day: meals, a weigh-in, water, a check-in and (today only)
 * medication. Yesterday can still be filled in; earlier days have nothing open. Empty hides it.
 */
export function LeftToDoList() {
  const navigation = useRootNavigation();
  const { openItems, lastWeight, isToday } = useDayItems();
  const { formatWeight } = useUnits();
  const { setTaken } = useMedication();

  if (!openItems.length) return null;
  return (
    <>
      <GroupLabel>{isToday ? 'Left to do' : 'Left from yesterday'}</GroupLabel>
      <Group>
        {openItems.map((item) =>
          item.kind === 'water' ? (
            <WaterTodoRow key='water' />
          ) : item.kind === 'checkIn' ? (
            <Row
              key='check-in'
              title='Check in'
              sub={`${isToday ? 'How are your mood and stress today' : 'How were your mood and stress yesterday'}?`}
              onPress={() => navigation.navigate('CheckIn')}
              icon={
                <IconBadge bg={colors.violetTint}>
                  <Icon
                    name='emoticon-happy-outline'
                    size={16}
                    color={colors.violet}
                  />
                </IconBadge>
              }
              chevron
            />
          ) : item.kind === 'medication' ? (
            <Row
              key={`med-${item.medicationId}`}
              title={`Take ${item.name}`}
              sub={`Due ${formatMinutes(item.at)}`}
              icon={
                <IconBadge bg={colors.violetTint}>
                  <Icon name='pill' size={16} color={colors.violet} />
                </IconBadge>
              }
              right={
                // Like water, only the button records a dose, so a stray tap on the row can't.
                <Pressable
                  onPress={() => setTaken(item.medicationId, true)}
                  hitSlop={8}
                  style={s.addBtn}
                  accessibilityRole='button'
                  accessibilityLabel={`Mark ${item.name} taken`}
                >
                  <Text style={s.markText}>Mark taken</Text>
                </Pressable>
              }
            />
          ) : item.kind === 'meal' ? (
            <Row
              key='meal'
              title={item.title}
              sub={item.sub}
              onPress={() =>
                navigation.navigate('LogFood', { meal: item.meal })
              }
              icon={
                <IconBadge bg={colors.kelpTint}>
                  <Icon
                    name='silverware-fork-knife'
                    size={16}
                    color={colors.kelp}
                  />
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
