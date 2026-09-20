import { daysWithWaypoints, milestonesFor, type LedgerEvent } from './models';

const ev = (day: string, points: number, source: LedgerEvent['source'] = 'steps'): LedgerEvent => ({
  day,
  points,
  source,
});

describe('milestonesFor', () => {
  it('dates each reached stop by replaying the ledger in day order', () => {
    // Deliberately out of order.
    const events = [ev('2026-03-03', 100), ev('2026-03-01', 200), ev('2026-03-05', 400)];
    const [capeCod, novaScotia, newfoundland] = milestonesFor(700, events);
    expect(capeCod).toMatchObject({ reached: true, reachedOn: '2026-03-03' }); // 200+100 >= 250
    expect(novaScotia).toMatchObject({ reached: true, reachedOn: '2026-03-05' }); // 700 >= 600
    expect(newfoundland.reached).toBe(false);
    expect(newfoundland.reachedOn).toBeUndefined();
  });

  it('counts a stop as reached even when the events behind it are missing', () => {
    const [capeCod] = milestonesFor(300, []);
    expect(capeCod).toMatchObject({ reached: true });
    expect(capeCod.reachedOn).toBeUndefined();
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
