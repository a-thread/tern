import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { hasSent } from '@/domain/ternary/models/postcards';

enum SendState {
  Idle,
  Sending,
  Sent,
  Failed,
}

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
  const [state, setState] = useState(SendState.Idle);
  if (!ternary || hidden) return null;
  if (state === SendState.Idle && hasSent(ternary.postcards, stopId))
    return null;

  const busy = state === SendState.Sending || state === SendState.Sent;
  const send = async () => {
    if (busy) return;
    setState(SendState.Sending);
    try {
      await sendPostcard(stopId);
      setState(SendState.Sent);
    } catch (e) {
      console.warn('Could not send a postcard', e);
      setState(SendState.Failed);
    }
  };

  // Short on the button, which already sits on the stop's own card; the whole sentence for a
  // screen reader, which hears it out of that context.
  const label = {
    [SendState.Idle]: 'Send a postcard',
    [SendState.Sending]: 'Sending…',
    [SendState.Sent]: 'Postcard sent',
    [SendState.Failed]: 'Couldn’t send it. Try again',
  }[state];
  const spoken =
    state === SendState.Sent
      ? `Postcard sent to ${ternary.name}`
      : state === SendState.Idle
        ? `Send ${ternary.name} a postcard from ${name}`
        : label;

  return (
    <Pressable
      style={[s.button, state === SendState.Sent && s.sent]}
      onPress={send}
      disabled={busy}
      accessibilityRole='button'
      accessibilityLabel={spoken}
      accessibilityState={{ disabled: busy }}
    >
      <Icon
        name={state === SendState.Sent ? 'check' : 'email-outline'}
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
