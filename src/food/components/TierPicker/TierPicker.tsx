import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, radius, tierColors, typography } from '@shared/theme';
import type { Tier } from '@/domain/food/models/foodEntry';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { TierDot } from '@shared/components/TierDot';
import { tierSuggestionNote } from './utils/tierSuggestionNote';

const tierPickerOptions: { tier: Tier; label: string; a11yLabel: string }[] = [
  { tier: 1, label: 'Whole', a11yLabel: 'Whole, NOVA 1 or 2' },
  { tier: 3, label: 'Processed', a11yLabel: 'Processed, NOVA 3' },
  { tier: 4, label: 'Ultra-proc.', a11yLabel: 'Ultra-processed, NOVA 4' },
];

/**
 * Food-type picker: Whole (tiers 1–2) / Processed (3) / Ultra-processed (4).
 * `suggested` shows where the pre-picked type came from; the user's own tap always wins. What
 * each level means lives in the info sheet beside the "Food type" label (`FoodTypeLabel`).
 */
export function TierPicker({
  value,
  onChange,
  suggested,
  suggestedBy,
  showNumber = true,
}: {
  value: Tier | null;
  onChange: (tier: Tier) => void;
  suggested?: Tier | null;
  /**
   * Where the suggestion came from, for the note under the picker. Unset for a food you logged
   * before, or one you made yourself.
   */
  suggestedBy?: SearchResult['source'];
  showNumber?: boolean;
}) {
  const note = tierSuggestionNote(suggested, suggestedBy);
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
              accessibilityRole='button'
              accessibilityLabel={opt.a11yLabel}
              accessibilityState={{ selected }}
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
      {note ? (
        <Text
          style={[
            s.suggestNote,
            !suggested && { backgroundColor: colors.doveTint },
          ]}
        >
          {note}
        </Text>
      ) : null}
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
