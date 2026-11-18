import React, { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { space } from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { TipFish } from './models/tipFish';
import { tipThanks } from './models/tipThanks';
import { TipTile } from './components/TipTile/TipTile';
import { TipThanks } from './components/TipThanks/TipThanks';

/** Unlocks nothing. Hidden when the store has no tips. */
export function TipJar() {
  const { tips, tip } = useSubscription();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  // `n` counts tips, so a second one replays the thank-you's entrance even with the same words.
  const [thanks, setThanks] = useState<{ text: string; n: number } | null>(
    null,
  );
  if (!tips.length) return null;

  const leave = async (id: string, fish: string) => {
    if (busy) return;
    setBusy(id);
    try {
      const text = tipThanks(await tip(id), fish);
      if (text) {
        setThanks((was) => ({ text, n: (was?.n ?? 0) + 1 }));
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
      {thanks ? <TipThanks key={thanks.n} text={thanks.text} /> : null}
    </>
  );
}

const s = StyleSheet.create({
  jar: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
});
