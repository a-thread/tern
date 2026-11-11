import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';

/**
 * The tip jar: a one-off "buy the developer a coffee" through the store. It unlocks nothing,
 * and nothing is held back from anyone who doesn't tip. Hidden when the store has no tips.
 */
export function TipJar() {
  const { tips, tip } = useSubscription();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  if (!tips.length) return null;

  const leave = async (id: string) => {
    if (busy) return;
    setBusy(id);
    try {
      if (await tip(id)) toast.show('Thank you. That means a lot.');
    } catch (e) {
      console.warn('Could not leave a tip', e);
      toast.show('Couldn’t reach the store. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={s.jar}>
      {tips.map((t) => (
        <Pressable
          key={t.id}
          style={[s.amount, busy !== null && s.waiting]}
          onPress={() => leave(t.id)}
          disabled={busy !== null}
          accessibilityRole='button'
          accessibilityLabel={`Tip ${t.price}`}
          accessibilityState={{ busy: busy === t.id }}
        >
          <Icon name='coffee-outline' size={18} color={colors.sunDeep} />
          <Text style={s.price}>{t.price}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  jar: { flexDirection: 'row', gap: space.sm },
  amount: {
    flex: 1,
    minHeight: 64,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  waiting: { opacity: 0.5 },
  price: typography.heading,
});
