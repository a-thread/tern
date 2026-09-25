import {
  MIGRATION_LENGTH,
  MILESTONE_STOPS,
  daysWithWaypoints,
  latestMilestone,
  migrationProgress,
  milestonesFor,
  type LedgerEvent,
} from './models';

const ev = (day: string, points: number, source: LedgerEvent['source'] = 'steps'): LedgerEvent => ({
  day,
  points,
  source,
});

describe('milestonesFor', () => {
  it('dates each reached stop by replaying the ledger in day order', () => {
    // Deliberately out of order.
    const events = [ev('2026-03-03', 100), ev('2026-03-01', 200), ev('2026-03-05', 400)];
    const [first, second, third] = milestonesFor(700, events);
    expect(first).toMatchObject({ reached: true, reachedOn: '2026-03-03' }); // 200+100 >= 250
    expect(second).toMatchObject({ reached: true, reachedOn: '2026-03-05' }); // 700 >= 600
    expect(third.reached).toBe(false);
    expect(third.reachedOn).toBeUndefined();
  });

  it('counts a stop as reached even when the events behind it are missing', () => {
    const [first] = milestonesFor(300, []);
    expect(first).toMatchObject({ reached: true });
    expect(first.reachedOn).toBeUndefined();
  });

  it('reaches nothing with no waypoints', () => {
    expect(milestonesFor(0, []).every((m) => !m.reached)).toBe(true);
  });
});

describe('daysWithWaypoints', () => {
  it('counts distinct days, not events', () => {
    expect(
      daysWithWaypoints([ev('2026-03-01', 40), ev('2026-03-01', 15, 'meals'), ev('2026-03-02', 40)]),
    ).toBe(2);
  });
});

describe('latestMilestone', () => {
  const LAST = MILESTONE_STOPS[MILESTONE_STOPS.length - 1];

  it('is null before the first stop', () => {
    expect(latestMilestone(0)).toBeNull();
    expect(latestMilestone(MILESTONE_STOPS[0].waypoints - 1)).toBeNull();
  });

  it('names the stop just reached, on the right migration', () => {
    expect(latestMilestone(MILESTONE_STOPS[0].waypoints)).toMatchObject({
      name: MILESTONE_STOPS[0].name,
      lap: 1,
    });
    expect(latestMilestone(MILESTONE_STOPS[1].waypoints + 10)).toMatchObject({
      name: MILESTONE_STOPS[1].name,
      lap: 1,
    });
    expect(
      latestMilestone(MIGRATION_LENGTH + MILESTONE_STOPS[1].waypoints),
    ).toMatchObject({ name: MILESTONE_STOPS[1].name, lap: 2 });
  });

  it('holds the last stop of a finished migration until the next one begins', () => {
    expect(latestMilestone(MIGRATION_LENGTH)).toMatchObject({
      name: LAST.name,
      lap: 1,
      waypoints: MIGRATION_LENGTH,
    });
    expect(latestMilestone(MIGRATION_LENGTH + 10)).toMatchObject({
      name: LAST.name,
      lap: 1,
    });
  });
});

describe('the migration loops', () => {
  it('starts the next migration after the last stop, so there is always a next milestone', () => {
    const past = milestonesFor(MIGRATION_LENGTH + 300, []);
    const next = past.find((m) => !m.reached)!;
    expect(next).toMatchObject({ lap: 2, name: MILESTONE_STOPS[1].name });
    expect(next.waypoints).toBe(MIGRATION_LENGTH + MILESTONE_STOPS[1].waypoints);
    expect(past.filter((m) => m.reached)).toHaveLength(MILESTONE_STOPS.length + 1);
    expect(new Set(past.map((m) => m.id)).size).toBe(past.length);
  });

  it('reports which migration a total is on and how far through it', () => {
    expect(migrationProgress(0)).toEqual({ lap: 1, progress: 0 });
    expect(migrationProgress(MIGRATION_LENGTH / 2)).toEqual({ lap: 1, progress: 0.5 });
    expect(migrationProgress(MIGRATION_LENGTH)).toEqual({ lap: 2, progress: 0 });
  });
});
