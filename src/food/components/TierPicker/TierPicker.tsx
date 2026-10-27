import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, radius, tierColors, typography } from '@shared/theme';
import type { Tier } from '@/domain/food/models/foodEntry';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { TierDot } from '@shared/components/TierDot';
import { FoodSource } from '@/domain/food/models/foodSource';

const tierPickerOptions: { tier: Tier; label: string }[] = [
  { tier: 1, label: 'Whole' },
  { tier: 3, label: 'Processed' },
  { tier: 4, label: 'Ultra-proc.' },
];

/**
 * Food-type picker: Whole (tiers 1–2) / Processed (3) / Ultra-processed (4).
 * `suggested` shows the auto-suggested note; the user's own tap always wins. `editing` is for a
 * food already logged, whose type was settled when it was added.
 */
export function TierPicker({
  value,
  onChange,
  suggested,
  suggestedBy,
  showNumber = true,
  editing = false,
}: {
  value: Tier | null;
  onChange: (tier: Tier) => void;
  suggested?: Tier | null;
  /** Where the suggestion came from, for the note under the picker. Unset for a food you logged before. */
  suggestedBy?: SearchResult['source'];
  showNumber?: boolean;
  editing?: boolean;
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
              <TierDot
                tier={opt.tier}
                color={tierColors[opt.tier]}
                showNumber={showNumber}
              />
              <Text style={[s.tierOptLabel, selected && s.tierOptLabelSel]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {editing ? (
        <Text style={s.suggestNote}>
          Change it if it doesn't fit. Your choice is remembered for this food.
        </Text>
      ) : suggested ? (
        <Text style={s.suggestNote}>
          {suggestedBy === FoodSource.Off
            ? `Suggested from Open Food Facts processing data (NOVA ${suggested}).`
            : suggestedBy === FoodSource.Common
              ? `Suggested for this kind of food (NOVA ${suggested}).`
              : 'The type you chose last time.'}{' '}
          You can change it — your choice is remembered for this food.
        </Text>
      ) : (
        <Text style={[s.suggestNote, { backgroundColor: colors.doveTint }]}>
          No processing data for this food — pick whichever fits.
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
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
  tierOptLabel: typography.small,
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
});
