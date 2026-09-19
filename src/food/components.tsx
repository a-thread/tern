import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, radius, tierColors } from '@shared/theme';
import type { Tier, FoodEntry } from './models';
import { tierPickerOptions } from './searchData';

/** NOVA processing tier. Shows the number by default — not color alone — for a11y; user-togglable in Settings. */
export function TierDot({
  tier,
  color,
  showNumber = true,
}: {
  tier: number;
  color: string;
  showNumber?: boolean;
}) {
  return (
    <View style={[s.tier, { backgroundColor: color }]}>
      {showNumber ? <Text style={s.tierText}>{tier}</Text> : null}
    </View>
  );
}

/**
 * Food-type picker: Whole (tiers 1–2) / Processed (3) / Ultra-processed (4).
 * `suggested` shows the auto-suggested note; the user's own tap always wins.
 */
export function TierPicker({
  value,
  onChange,
  suggested,
}: {
  value: Tier | null;
  onChange: (tier: Tier) => void;
  suggested?: Tier | null;
}) {
  return (
    <View>
      <View style={s.tierPicker}>
        {tierPickerOptions.map((opt) => {
          const selected =
            value === opt.tier || (value === 2 && opt.tier === 1);
          return (
            <Pressable
              key={opt.tier}
              onPress={() => onChange(opt.tier)}
              style={[s.tierOpt, selected && s.tierOptSel]}
            >
              <TierDot tier={opt.tier} color={tierColors[opt.tier]} />
              <Text style={[s.tierOptLabel, selected && s.tierOptLabelSel]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {suggested ? (
        <Text style={s.suggestNote}>
          Suggested from Open Food Facts processing data (NOVA {suggested}). You
          can change it — your choice is remembered for this food.
        </Text>
      ) : (
        <Text style={[s.suggestNote, { backgroundColor: colors.doveTint }]}>
          No suggestion available for custom foods — pick whichever fits.
        </Text>
      )}
    </View>
  );
}

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
  tier: {
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: { fontFamily: font.bold, fontSize: 9.5, color: '#fff' },
  tierPicker: { flexDirection: 'row', gap: 7 },
  tierOpt: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  tierOptSel: { borderColor: colors.coral, backgroundColor: colors.coralTint },
  tierOptLabel: { fontFamily: font.body, fontSize: 11, color: colors.ink2 },
  tierOptLabelSel: { fontFamily: font.bold, color: colors.ink },
  suggestNote: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.ink2,
    backgroundColor: colors.waterTint,
    borderRadius: radius.md,
    padding: 10,
    marginTop: 9,
  },
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
