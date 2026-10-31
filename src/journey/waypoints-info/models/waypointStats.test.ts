import { WaypointSource } from '@/domain/waypoints/models/waypoint';
import { waypointStats } from './waypointStats';

const award = (day: string, points: number, source = WaypointSource.Steps) => ({
  day,
  points,
  source,
});

describe('waypointStats', () => {
  it('counts each day once, however many awards it had', () => {
    const stats = waypointStats(
      [
        award('2026-10-01', 40),
        award('2026-10-01', 15, WaypointSource.Meals),
        award('2026-10-03', 10, WaypointSource.Rest),
      ],
      '2026-10-03',
    );
    expect(stats.days).toBe(2);
  });

  it('adds up the last seven days, today included', () => {
    const stats = waypointStats(
      [
        award('2026-09-26', 40),
        award('2026-09-27', 40),
        award('2026-10-03', 15),
      ],
      '2026-10-03',
    );
    expect(stats.thisWeek).toBe(55);
  });

  it('finds the best day by its total, the earlier one on a tie', () => {
    const stats = waypointStats(
      [
        award('2026-10-01', 40),
        award('2026-10-01', 15, WaypointSource.Meals),
        award('2026-10-02', 55),
        award('2026-10-03', 20),
      ],
      '2026-10-03',
    );
    expect(stats.best).toEqual({ day: '2026-10-01', points: 55 });
  });

  it('has no best day before any waypoints', () => {
    expect(waypointStats([], '2026-10-03')).toEqual({
      days: 0,
      thisWeek: 0,
      best: null,
    });
  });
});
