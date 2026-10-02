import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font } from '@shared/theme';
import type { FoodEntry } from '@food/models';

/** Reassigns which meal a food entry counts toward. */
export function MealPicker({
  value,
  onChange,
  options,
}: {
  value: FoodEntry['meal'];
  onChange: (meal: FoodEntry['meal']) => void;
  options: { key: FoodEntry['meal']; label: string }[];
}) {
  return (
    <View style={s.mealPicker}>
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[s.mealOpt, selected && s.mealOptSel]}
          >
            <Text style={[s.mealOptLabel, selected && s.mealOptLabelSel]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  mealPicker: {
    flexDirection: 'row',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  mealOpt: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  mealOptSel: { backgroundColor: '#fff' },
  mealOptLabel: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  mealOptLabelSel: { fontFamily: font.semibold, color: colors.ink },
});
