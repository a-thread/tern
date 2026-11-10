import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { FootNote, GroupLabel, Icon } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { fishable, TernaryRules } from '@/domain/ternary/models/ternary';

/**
 * Fish brought to you, and bringing one to a friend: terns court and feed each other with
 * fish. Any friend can be brought one, quiet or not, and it waits for them without a
 * notification, so it never reads as "come back". Fish earn nothing.
 */
export function BringFish() {
  const { ternary, bringFish } = useTernary();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!ternary) return null;

  const left = Math.max(TernaryRules.MAX_FISH_PER_DAY - ternary.fishSentToday, 0);
  const bring = async (userId: string, name: string) => {
    if (busy || !left) return;
    setBusy(true);
    try {
      await bringFish(userId);
      toast.show(`You brought ${name} a fish.`);
    } catch (e) {
      console.warn('Could not bring a fish', e);
      toast.show('Couldn’t bring that fish just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      {ternary.fish.map((f) => (
        <View key={f.id} style={s.gift}>
          <View style={s.giftIcon}>
            <Icon name='fish' size={18} color={colors.sunDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.heading}>{`${f.fromName} brought you a fish`}</Text>
            <Text style={typography.meta}>Terns bring each other fish to say they care.</Text>
          </View>
        </View>
      ))}

      <GroupLabel>Bring someone a fish</GroupLabel>
      <View style={s.grid}>
        {fishable(ternary.members).map((m) => (
          <Pressable
            key={m.userId}
            style={[s.friend, !left && s.off]}
            onPress={() => bring(m.userId, m.name)}
            disabled={!left || busy}
            accessibilityRole='button'
            accessibilityLabel={`Bring ${m.name} a fish`}
          >
            <View style={s.initial}>
              <Text style={s.initialText}>{m.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={typography.rowTitle} numberOfLines={1}>
              {m.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <FootNote>
        {left
          ? `A fish waits in their tern’s bill until they next open Tern. You can bring ${left} more today.`
          : 'That’s all the fish for today. You can bring more tomorrow.'}
      </FootNote>
    </View>
  );
}

const s = StyleSheet.create({
  gift: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.md,
    marginTop: space.md,
  },
  giftIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.sunTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  friend: {
    width: '31%',
    minHeight: 72,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    padding: space.sm,
  },
  off: { opacity: 0.5 },
  initial: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.violetTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: { ...typography.label, color: colors.violet },
});
