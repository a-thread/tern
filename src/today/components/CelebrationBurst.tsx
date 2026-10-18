import React from 'react';

import WaypointBurst from '@shared/components/WaypointBurst';
import { labelFor } from '@/domain/waypoints/models/waypoint';
import { useWaypoints } from '@/domain/waypoints/WaypointsContext';
import type { Playing } from '../hooks/useCelebrationPlayback';

/** The waypoints flying from the hero to the header chip; they are counted once they arrive. */
export function CelebrationBurst({
  playing,
  onDone,
}: {
  playing: Playing;
  onDone: () => void;
}) {
  const { completeCelebration } = useWaypoints();
  const { celebration } = playing;

  return (
    <WaypointBurst
      key={celebration.id}
      id={celebration.id}
      points={celebration.points}
      label={labelFor(celebration.source)}
      origin={playing.origin}
      target={playing.target}
      onArrive={() => completeCelebration(celebration.id)}
      onDone={onDone}
    />
  );
}
