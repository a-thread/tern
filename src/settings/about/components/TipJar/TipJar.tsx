import React, { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { space } from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { TipFish } from './models/tipFish';
import { tipThanks } from './models/tipThanks';
import { TipTile } from './components/TipTile/TipTile';
import { TipThanks } from './components/TipThanks/TipThanks';

/**
 * The tip jar: a one-off thank-you through the store, shown as fish to bring Tern. It unlocks
 * nothing, and nothing is held back from anyone who doesn't tip. Hidden when the store has no tips.
 */
export function TipJar() {
  const { tips, tip } = useSubscription();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);
  if (!tips.length) return null;

  const leave = async (id: string, fish: string) => {
    if (busy) return;
    setBusy(id);
    try {
      const text = tipThanks(await tip(id), fish);
      if (text) {
        setThanks(text);
        AccessibilityInfo.announceForAccessibility(text);
      }
    } catch (e) {
      console.warn('Could not leave a tip', e);
      toast.show('Couldn’t reach the store. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <View style={s.jar}>
        {tips.map((t, i) => {
          const fish = TipFish.nameAt(i);
          return (
            <TipTile
              key={t.id}
              price={t.price}
              fish={fish}
              fishSize={TipFish.sizeAt(i)}
              busy={busy === t.id}
              disabled={busy !== null}
              onPress={() => leave(t.id, fish)}
            />
          );
        })}
      </View>
      {thanks ? <TipThanks text={thanks} /> : null}
    </>
  );
}

const s = StyleSheet.create({
  jar: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
});
