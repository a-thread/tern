import React from 'react';

import { FootNote, GroupLabel } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { useWaypoints } from '@/domain/waypoints/WaypointsContext';
import { latestMilestone } from '@/domain/waypoints/models/milestone';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { TernaryButton } from '../components/TernaryButton/TernaryButton';
import { PostcardCard } from './components/PostcardCard/PostcardCard';

/**
 * Postcards: when your own tern reaches a stop, you can choose to send the ternary a card of
 * the place with a fact about it. It never shows a date reached, a total or how long the trip
 * took, so "where's everyone?" is a moment someone chose to share, never a scoreboard.
 */
export default function PostcardsScreen() {
  const { ternary, sendPostcard } = useTernary();
  const { waypoints } = useWaypoints();
  const toast = useToast();
  if (!ternary) return <TernaryPage title='Postcards'>{null}</TernaryPage>;

  const mine = latestMilestone(waypoints);
  const stopId = mine ? mine.id.replace(/^\d+-/, '') : null;
  const sent = ternary.postcards.some((p) => p.yours && p.stopId === stopId);

  const send = async () => {
    if (!stopId) return;
    try {
      await sendPostcard(stopId);
      toast.show('Your postcard is on its way.');
    } catch (e) {
      console.warn('Could not send a postcard', e);
      toast.show('Couldn’t send that just now. Please try again.');
    }
  };

  return (
    <TernaryPage title='Postcards'>
      {mine && !sent ? (
        <>
          <GroupLabel>From your journey</GroupLabel>
          <TernaryButton label={`Send a postcard from ${mine.name}`} onPress={send} />
          <FootNote>
            {`Your own tern reached ${mine.name}. Only the place is sent.`}
          </FootNote>
        </>
      ) : null}

      <GroupLabel>Received</GroupLabel>
      {ternary.postcards.length ? (
        ternary.postcards.map((p) => <PostcardCard key={p.id} card={p} />)
      ) : (
        <FootNote>
          No postcards yet. When a friend’s tern reaches a stop, they can send one
          here.
        </FootNote>
      )}
    </TernaryPage>
  );
}
