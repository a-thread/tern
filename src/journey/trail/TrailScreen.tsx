import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { PopupCard, popup } from '@shared/components/PopupCard/PopupCard';
import { gradients, space } from '@shared/theme';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { TrailPicker } from './components/TrailPicker/TrailPicker';

/**
 * A Supporter's thank-you: the color of the line their tern has flown, from the link under
 * the map on Journey. Anyone else who lands here (Supporter ended while it was open) is told
 * what it is instead of being offered a choice that wouldn't show.
 */
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
