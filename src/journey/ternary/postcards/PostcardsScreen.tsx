import React, { useState } from 'react';

import { FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { useWaypoints } from '@/domain/waypoints/WaypointsContext';
import { sendableStops } from '@/domain/ternary/models/postcards';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { PostcardCard } from './components/PostcardCard/PostcardCard';

/**
 * Postcards: from any stop your own tern has reached on this migration, you can choose to
 * send the ternary a card of the place, once per stop per lap. It never shows a date reached,
 * a total or how long the trip took, so "where's everyone?" is a moment someone chose to
 * share, never a scoreboard.
 */
export default function PostcardsScreen() {
  const { ternary, sendPostcard } = useTernary();
  const { waypoints, events } = useWaypoints();
  const toast = useToast();
  const [sending, setSending] = useState<string | null>(null);
  if (!ternary) return <TernaryPage title='Postcards'>{null}</TernaryPage>;

  const sendable = sendableStops(waypoints, events, ternary.postcards);

  const send = async (stopId: string, name: string) => {
    if (sending) return;
    setSending(stopId);
    try {
      await sendPostcard(stopId);
      toast.show(`Your postcard from ${name} is on its way.`);
    } catch (e) {
      console.warn('Could not send a postcard', e);
      toast.show('Couldn’t send that just now. Please try again.');
    } finally {
      setSending(null);
    }
  };

  return (
    <TernaryPage title='Postcards'>
      {sendable.length ? (
        <>
          <GroupLabel>Send one from your journey</GroupLabel>
          <Group>
            {sendable.map((stop) => (
              <Row
                key={stop.id}
                title={stop.name}
                sub={
                  sending === stop.id ? 'Sending…' : 'Send a postcard from here'
                }
                chevron
                onPress={() => send(stop.id, stop.name)}
              />
            ))}
          </Group>
          <FootNote>
            Stops your own tern has reached on this migration. Only the place is
            sent, once per stop.
          </FootNote>
        </>
      ) : null}

      <GroupLabel>Received</GroupLabel>
      {ternary.postcards.length ? (
        ternary.postcards.map((p, i) => (
          <PostcardCard key={p.id} card={p} index={i} />
        ))
      ) : (
        <FootNote>
          No postcards yet. When a friend’s tern reaches a stop, they can send
          one here.
        </FootNote>
      )}
    </TernaryPage>
  );
}
