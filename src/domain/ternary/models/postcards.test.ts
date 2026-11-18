import { Milestones } from '../../waypoints/models/milestone';
import {
  hasSent,
  onCurrentLap,
  senderLook,
  sendableStops,
  withLap,
} from './postcards';
import type { Postcard, TernaryMember } from './ternary';

const [first, second, third] = Milestones.STOPS;
const sent = (stopId: string, yours = true): Postcard => ({
  id: stopId,
  fromName: yours ? 'You' : 'Maya',
  fromId: yours ? 'you' : 'maya',
  stopId,
  yours,
});

describe('withLap', () => {
  it('reads a stop without a lap as the first migration’s', () => {
    expect(withLap('iceland')).toBe('1-iceland');
    expect(withLap('2-iceland')).toBe('2-iceland');
  });
});

describe('hasSent', () => {
  it('counts only your own postcards, from that stop on that lap', () => {
    const cards = [sent(first.id), sent(`2-${second.id}`, false)];
    expect(hasSent(cards, `1-${first.id}`)).toBe(true);
    expect(hasSent(cards, `2-${first.id}`)).toBe(false);
    expect(hasSent(cards, `2-${second.id}`)).toBe(false);
  });
});

describe('sendableStops', () => {
  it('offers every stop reached this lap, newest first, but not one already sent', () => {
    const stops = sendableStops(third.waypoints, [], [sent(`1-${second.id}`)]);
    expect(stops.map((m) => m.id)).toEqual([`1-${third.id}`, `1-${first.id}`]);
  });

  it('offers nothing before the first stop', () => {
    expect(sendableStops(first.waypoints - 1, [], [])).toEqual([]);
  });

  it('starts again on the next migration', () => {
    const total = Milestones.MIGRATION_LENGTH + first.waypoints;
    const stops = sendableStops(total, [], [sent(`1-${first.id}`)]);
    expect(stops.map((m) => m.id)).toEqual([`2-${first.id}`]);
  });
});

describe('onCurrentLap', () => {
  it('is true only for the migration you’re on', () => {
    const total = Milestones.MIGRATION_LENGTH + first.waypoints;
    expect(onCurrentLap(total, { lap: 2 })).toBe(true);
    expect(onCurrentLap(total, { lap: 1 })).toBe(false);
    expect(onCurrentLap(first.waypoints - 1, { lap: 1 })).toBe(false);
  });
});

describe('senderLook', () => {
  const members = [
    { userId: 'sam', you: false, look: 3 },
    { userId: 'me', you: true, look: 6 },
    { userId: 'maya', you: false, look: 2 },
  ] as TernaryMember[];

  it('is the bird the sender chose', () => {
    expect(senderLook(members, { fromId: 'maya', yours: false })).toBe(2);
    expect(senderLook(members, { yours: true })).toBe(6);
  });

  it('falls back to the first look for someone who left', () => {
    expect(senderLook(members, { fromId: 'gone', yours: false })).toBe(0);
  });
});
