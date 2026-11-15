import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { hasSent } from '@/domain/ternary/models/postcards';

/**
 * On a stop's card (the one that celebrates reaching it, or a past stop opened from Journey):
 * a quiet offer to send your ternary a postcard from it. Only in a ternary that isn't hidden,
 * and not once it's been sent; it's never asked twice, and nothing happens if it's left alone.
 */
export function SendPostcard({
  stopId,
  name,
}: {
  stopId: string;
  name: string;
}) {
  const { ternary, hidden, sendPostcard } = useTernary();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>(
    'idle',
  );
  if (!ternary || hidden) return null;
  if (state === 'idle' && hasSent(ternary.postcards, stopId)) return null;

  const send = async () => {
    if (state === 'sending' || state === 'sent') return;
    setState('sending');
    try {
      await sendPostcard(stopId);
      setState('sent');
    } catch (e) {
      console.warn('Could not send a postcard', e);
      setState('failed');
    }
  };

  const label =
    state === 'sent'
      ? `Postcard sent to ${ternary.name}`
      : state === 'failed'
        ? 'Couldn’t send it. Try again'
        : state === 'sending'
          ? 'Sending…'
          : `Send ${ternary.name} a postcard from ${name}`;

  return (
    <Pressable
      style={[s.button, state === 'sent' && s.sent]}
      onPress={send}
      disabled={state === 'sending' || state === 'sent'}
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityState={{ disabled: state === 'sending' || state === 'sent' }}
    >
      <Icon
        name={state === 'sent' ? 'check' : 'email-outline'}
        size={16}
        color={colors.sunLight}
      />
      <Text style={s.label}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 44,
    marginTop: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.chipOnDark,
  },
  sent: { opacity: 0.85 },
  label: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.onDark,
    flexShrink: 1,
  },
});
