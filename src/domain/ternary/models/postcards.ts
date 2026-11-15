import {
  latestMilestone,
  type Milestone,
  milestonesFor,
} from '../../waypoints/models/milestone';
import type { LedgerEvent } from '../../waypoints/models/waypoint';
import type { Postcard, TernaryMember } from './ternary';

/**
 * A postcard's stop with its lap ("2-iceland"). Postcards sent before laps were kept have
 * none, and read as the first migration's.
 */
export const withLap = (stopId: string) =>
  /^\d+-/.test(stopId) ? stopId : `1-${stopId}`;

/** You've already sent a postcard from this stop on this lap. */
export const hasSent = (postcards: readonly Postcard[], stopId: string) =>
  postcards.some((p) => p.yours && withLap(p.stopId) === withLap(stopId));

/**
 * The stops on your own journey you can send a postcard from: every stop reached on the
 * migration you're on now, not yet sent, newest first. One postcard per stop per lap, so a
 * stop reached again on the next migration can be sent again.
 */
export function sendableStops(
  total: number,
  events: LedgerEvent[],
  postcards: readonly Postcard[],
): Milestone[] {
  const latest = latestMilestone(total);
  if (!latest) return [];
  return milestonesFor(total, events)
    .filter(
      (m) => m.reached && m.lap === latest.lap && !hasSent(postcards, m.id),
    )
    .reverse();
}

/**
 * Which look (bird and colour) a postcard's sender flies as, for its stamp: their place in
 * the ternary, as in the flock. The first look for someone no longer in it.
 */
export function senderLook(
  members: readonly TernaryMember[],
  card: Pick<Postcard, 'fromId' | 'yours'>,
): number {
  const i = members.findIndex((m) =>
    card.yours ? m.you : m.userId === card.fromId,
  );
  return Math.max(i, 0);
}
