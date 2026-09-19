import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import type { Tier } from '../models';
import { useFood } from '../FoodContext';
import { TierPicker } from '../components';
import { useFoodDisplay } from '../useFoodDisplay';
import type { LogFoodStackParamList } from '../types';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'ManualFoodEntry'>;

export default function ManualFoodEntryScreen({ navigation, route }: Props) {
  const { meal, name: initialName } = route.params;
  const insets = useSafeAreaInsets();
  const { addFoodEntry } = useFood();
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();

  const [name, setName] = useState(initialName ?? '');
  const [serving, setServing] = useState('1 serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [tier, setTier] = useState<Tier>(1);

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    addFoodEntry({
      name: name.trim(),
      meal,
      servings: 1,
      servingLabel: serving.trim() || '1 serving',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      tier,
    });
    navigation.getParent()?.goBack();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='New food'
        leftLabel='Cancel'
        onLeftPress={() => navigation.getParent()?.goBack()}
        rightLabel='Save'
        onRightPress={save}
        rightDisabled={!canSave}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps='handled'
      >
        <Text style={s.intro}>
          Homemade or missing from the database? Add what you know — you can
          leave macros blank and still log it.
        </Text>

        <GroupLabel>Basics</GroupLabel>
        <Group>
          <FieldRow
            label='Name'
            value={name}
            onChangeText={setName}
            placeholder='e.g. Chili, homemade'
          />
          <FieldRow
            label='Serving'
            value={serving}
            onChangeText={setServing}
            placeholder='e.g. 1 bowl'
          />
        </Group>

        <GroupLabel>Nutrition (optional)</GroupLabel>
        <Group>
          {showCalories ? (
            <FieldRow
              label='Calories'
              value={calories}
              onChangeText={setCalories}
              keyboardType='numeric'
              placeholder='—'
            />
          ) : null}
          <FieldRow
            label='Protein'
            value={protein}
            onChangeText={setProtein}
            keyboardType='numeric'
            placeholder='—'
            suffix='g'
          />
          <FieldRow
            label='Carbs'
            value={carbs}
            onChangeText={setCarbs}
            keyboardType='numeric'
            placeholder='—'
            suffix='g'
          />
          <FieldRow
            label='Fat'
            value={fat}
            onChangeText={setFat}
            keyboardType='numeric'
            placeholder='—'
            suffix='g'
          />
        </Group>

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

        <Pressable
          style={[s.bigBtn, !canSave && { opacity: 0.5 }]}
          onPress={save}
          disabled={!canSave}
        >
          <Text style={s.bigBtnText}>Save and log</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  suffix?: string;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        keyboardType={keyboardType}
        style={s.rowInput}
      />
      {suffix && value ? <Text style={s.rowSuffix}>{suffix}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  intro: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: colors.ink2,
    lineHeight: 18,
    marginTop: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 8,
  },
  rowLabel: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.ink,
    width: 78,
  },
  rowInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
    textAlign: 'right',
  },
  rowSuffix: { fontFamily: font.body, fontSize: 13, color: colors.ink2 },
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
});
