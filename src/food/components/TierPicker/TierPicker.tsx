import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, radius, tierColors, typography } from '@shared/theme';
import type { Tier } from '@/domain/food/models/foodEntry';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { TierDot } from '@shared/components/TierDot';
import {
  tierGroupA11yLabel,
  tierGroupOf,
  TierGroups,
} from '@/domain/food/models/tierGroups';
import { tierSuggestionNote } from './utils/tierSuggestionNote';

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
        {TierGroups.ALL.map((group) => {
          const tier = group.tiers[0];
          const selected = value !== null && tierGroupOf(value) === group;
          return (
            <Pressable
              key={group.key}
              onPress={() => onChange(tier)}
              style={[s.tierOpt, selected && s.tierOptSel]}
              accessibilityRole='button'
              accessibilityLabel={tierGroupA11yLabel(group)}
              accessibilityState={{ selected }}
            >
              <TierDot
                tier={tier}
                color={tierColors[tier]}
                showNumber={showNumber}
              />
              <Text style={[s.tierOptLabel, selected && s.tierOptLabelSel]}>
                {group.shortLabel}
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
