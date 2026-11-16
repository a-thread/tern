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
 * A stop on the migration you're on now, so a postcard can still be sent from it. Stops from
 * a migration already finished can't be: their postcard was that lap's to send.
 */
export const onCurrentLap = (total: number, stop: Pick<Milestone, 'lap'>) =>
  latestMilestone(total)?.lap === stop.lap;

/**
 * Which look (bird and colour) a postcard's sender flies as, for its stamp: the one they
 * chose, as in the flock. The first look for someone no longer in it.
 */
export function senderLook(
  members: readonly TernaryMember[],
  card: Pick<Postcard, 'fromId' | 'yours'>,
): number {
  const sender = members.find((m) =>
    card.yours ? m.you : m.userId === card.fromId,
  );
  return sender?.look ?? 0;
}
