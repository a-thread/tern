import { WaypointSource, type LedgerEvent } from './waypoint';
import { Milestones } from './milestone';
import { earnedOn, legFor, legProgress, routeFraction, stillOpen } from './waypointSummary';

const DAY = '2026-10-09';
const ev = (source: WaypointSource, points: number, day = DAY): LedgerEvent => ({ source, points, day });

describe('earnedOn', () => {
  it('lists the day, goal day first and the meals on one line', () => {
    const { lines, total } = earnedOn(
      [
        ev(WaypointSource.Water, 10),
        ev(WaypointSource.Lunch, 5),
        ev(WaypointSource.Steps, 40),
        ev(WaypointSource.Breakfast, 5),
        ev(WaypointSource.Steps, 40, '2026-10-08'), // another day
      ],
      DAY,
    );
    expect(lines).toEqual([
      { label: 'Step goal', points: 40 },
      { label: 'Breakfast and lunch', points: 10 },
      { label: 'Water goal', points: 10 },
    ]);
    expect(total).toBe(60);
  });

  it('reads three meals as a list', () => {
    const { lines } = earnedOn(
      [ev(WaypointSource.Breakfast, 5), ev(WaypointSource.Lunch, 5), ev(WaypointSource.Dinner, 5), ev(WaypointSource.Meals, 15)],
      DAY,
    );
    expect(lines).toEqual([
      { label: 'Breakfast, lunch and dinner', points: 15 },
      { label: 'All meals logged', points: 15 },
    ]);
  });

  it('is empty for a day with nothing', () => {
    expect(earnedOn([], DAY)).toEqual({ lines: [], total: 0 });
  });
});

describe('stillOpen', () => {
  const all = { mood: true, water: true, movement: true };

  it('suggests at most two, the next meal first', () => {
    expect(stillOpen([ev(WaypointSource.Breakfast, 5)], DAY, all)).toEqual([
      { label: 'Log lunch', points: 5 },
      { label: 'Check in', points: 10 },
    ]);
  });

  it('leaves out what is done or not tracked', () => {
    const events = [
      ev(WaypointSource.Breakfast, 5),
      ev(WaypointSource.Lunch, 5),
      ev(WaypointSource.Dinner, 5),
      ev(WaypointSource.Steps, 40),
    ];
    expect(stillOpen(events, DAY, { mood: false, water: true, movement: false })).toEqual([
      { label: 'Water goal', points: 10 },
    ]);
  });

  it('never suggests a weigh-in, a rest day or medication', () => {
    const labels = stillOpen([], DAY, all, 10).map((l) => l.label);
    expect(labels).toEqual(['Log breakfast', 'Check in', 'Water goal', 'Step goal', 'Log movement']);
  });

  it('is empty once everything is done', () => {
    const events = [
      WaypointSource.Breakfast,
      WaypointSource.Lunch,
      WaypointSource.Dinner,
      WaypointSource.Mood,
      WaypointSource.Water,
      WaypointSource.Steps,
      WaypointSource.Movement,
    ].map((s) => ev(s, 5));
    expect(stillOpen(events, DAY, all)).toEqual([]);
  });
});

describe('legFor', () => {
  it('runs from the colony to the first stop at the start', () => {
    const leg = legFor(100, []);
    expect(leg).toMatchObject({ fromName: 'Greenland', from: 0, next: { name: 'Iceland', waypoints: 250 } });
    expect(legProgress(leg, 100)).toBeCloseTo(0.4);
  });

  it('runs between the last stop passed and the next', () => {
    const leg = legFor(1184, []);
    expect(leg).toMatchObject({ fromName: 'The Azores', from: 1000, next: { name: 'Cape Verde', waypoints: 1500 } });
    expect(legProgress(leg, 1184)).toBeCloseTo(0.368);
  });

  it('starts again from the colony on a second migration', () => {
    const leg = legFor(Milestones.MIGRATION_LENGTH + 50, []);
    expect(leg).toMatchObject({ fromName: 'Greenland', from: Milestones.MIGRATION_LENGTH, next: { lap: 2, name: 'Iceland' } });
  });
});

describe('routeFraction', () => {
  it('places stops along one migration', () => {
    expect(routeFraction(0)).toBe(0);
    expect(routeFraction(Milestones.MIGRATION_LENGTH / 2)).toBeCloseTo(0.5);
    expect(routeFraction(Milestones.MIGRATION_LENGTH)).toBe(1);
    expect(routeFraction(Milestones.MIGRATION_LENGTH + 250)).toBeCloseTo(250 / Milestones.MIGRATION_LENGTH);
  });
});
