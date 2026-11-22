import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { PopupCard, popup } from '@shared/components/PopupCard/PopupCard';
import { gradients, space } from '@shared/theme';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { TrailPicker } from './components/TrailPicker/TrailPicker';

/** Non-Supporters (it lapsed while open) are told what it is rather than offered a dead choice. */
export default function TrailScreen() {
  const { supporter } = useSubscription();

  return (
    <PopupCard colors={gradients.journey} journeyLink={false}>
      <Text style={popup.title}>Your tern’s trail</Text>
      <Text style={popup.label}>A thank-you for supporting Tern</Text>
      {supporter ? <TrailPicker /> : null}
      <Text style={[popup.soft, s.note]}>
        {supporter
          ? 'Back to Arctic if Supporter ends.'
          : 'Supporters choose the color of their tern’s trail.'}
      </Text>
    </PopupCard>
  );
}

const s = StyleSheet.create({
  note: { marginTop: space.lg, textAlign: 'center', lineHeight: 17 },
});
