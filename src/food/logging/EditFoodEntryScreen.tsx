import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { MEAL_OPTIONS, type Tier } from '../models';
import { useFood } from '../FoodContext';
import { TierPicker, MealPicker } from '../components';
import { useFoodDisplay } from '../useFoodDisplay';
import { SERVING_STEP, stepServings } from '../servings';

type Props = NativeStackScreenProps<RootStackParamList, 'EditFood'>;

export default function EditFoodEntryScreen({ navigation, route }: Props) {
  const { entryId } = route.params;
  const insets = useSafeAreaInsets();
  const { foodLog, updateFoodEntry, removeFoodEntry } = useFood();
  const entry = foodLog.find((f) => f.id === entryId);
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();

  const [servings, setServings] = useState(entry?.servings ?? 1);
  const [servingLabel, setServingLabel] = useState(entry?.servingLabel ?? '');
  const [meal, setMeal] = useState(entry?.meal ?? 'breakfast');
  const [tier, setTier] = useState<Tier>(entry?.tier ?? 1);

  if (!entry) {
    // The entry was removed (e.g. from another session) while this screen was open.
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          paddingTop: insets.top,
        }}
      >
        <SheetNav
          title='Food'
          leftLabel='Close'
          onLeftPress={() => navigation.goBack()}
        />
        <Text style={s.gone}>This item is no longer in your log.</Text>
      </View>
    );
  }

  const step = (delta: number) =>
    setServings((v) => stepServings(v, delta));

  const save = () => {
    updateFoodEntry(entry.id, {
      servings,
      servingLabel: servingLabel.trim() || entry.servingLabel,
      meal,
      tier,
      tierOverridden: tier !== entry.tier || entry.tierOverridden,
    });
    navigation.goBack();
  };

  const confirmDelete = () => {
    Alert.alert('Remove food?', `Remove "${entry.name}" from today's log.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeFoodEntry(entry.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='Edit food'
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Save'
        onRightPress={save}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps='handled'
      >
        <View style={s.head}>
          <Text style={s.name}>{entry.name}</Text>
          {entry.brand ? <Text style={s.brand}>{entry.brand}</Text> : null}
        </View>

        {showCalories ? (
          <View style={s.calCard}>
            <Text style={s.calBig}>
              {Math.round(entry.calories * servings)}
            </Text>
            <Text style={s.calLabel}>
              calories at {servings} × {servingLabel || entry.servingLabel}
            </Text>
          </View>
        ) : null}

        <GroupLabel>Portion</GroupLabel>
        <Group>
          <View style={s.row}>
            <Text style={s.rowTitle}>Serving size</Text>
            <TextInput
              value={servingLabel}
              onChangeText={setServingLabel}
              placeholder={entry.servingLabel}
              placeholderTextColor={colors.ink3}
              style={s.rowInput}
            />
          </View>
          <View style={s.row}>
            <Text style={[s.rowTitle, { flex: 1 }]}>Servings</Text>
            <View style={s.stepper}>
              <Pressable onPress={() => step(-SERVING_STEP)} hitSlop={8}>
                <Text style={s.stepperBtn}>−</Text>
              </Pressable>
              <Text style={s.stepperVal}>{servings}</Text>
              <Pressable onPress={() => step(SERVING_STEP)} hitSlop={8}>
                <Text style={s.stepperBtn}>+</Text>
              </Pressable>
            </View>
          </View>
        </Group>

        <GroupLabel>Meal</GroupLabel>
        <View style={s.card}>
          <MealPicker value={meal} onChange={setMeal} options={MEAL_OPTIONS} />
        </View>

        {showTiers ? (
          <>
            <GroupLabel>Food type</GroupLabel>
            <View style={s.card}>
              <TierPicker
                value={tier}
                onChange={setTier}
                suggested={null}
                showNumber={showTierNumber}
              />
            </View>
          </>
        ) : null}

        <Pressable style={s.bigBtn} onPress={save}>
          <Text style={s.bigBtnText}>Save changes</Text>
        </Pressable>
        <Pressable style={s.deleteBtn} onPress={confirmDelete}>
          <Text style={s.deleteText}>Remove from log</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  gone: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink2,
    textAlign: 'center',
    marginTop: space.xl,
    paddingHorizontal: space.lg,
  },
  head: { paddingVertical: space.md },
  name: {
    fontFamily: font.display,
    fontSize: 21,
    color: colors.ink,
    lineHeight: 26,
  },
  brand: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: colors.ink2,
    marginTop: 3,
  },
  calCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  calBig: { fontFamily: font.displayMedium, fontSize: 32, color: colors.ink },
  calLabel: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 8,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    padding: 0,
    textAlign: 'right',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepperBtn: {
    fontFamily: font.body,
    fontSize: 17,
    color: colors.coral,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepperVal: {
    fontFamily: font.semibold,
    fontSize: 13.5,
    color: colors.ink,
    minWidth: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  bigBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg - 1,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: space.lg,
  },
  bigBtnText: { fontFamily: font.bold, fontSize: 14.5, color: '#fff' },
  deleteBtn: { alignItems: 'center', paddingVertical: 13, marginTop: 4 },
  deleteText: { fontFamily: font.semibold, fontSize: 13.5, color: '#B3261E' },
});
