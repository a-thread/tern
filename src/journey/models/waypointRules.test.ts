import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import {
  listedRules,
  pointsFor,
  StreakBonuses,
  streakBonus,
  WaypointRules,
  WaypointSource,
} from './waypoint';

describe('waypoint rules', () => {
  it('has one rule for every source', () => {
    const ids = WaypointRules.ALL.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(Object.values(WaypointSource).sort());
  });

  it('pays a little for each meal on top of the all-meals bonus', () => {
    expect(pointsFor(WaypointSource.Meals)).toBe(15);
    expect(WaypointRules.PER_MEAL.map(pointsFor)).toEqual([5, 5, 5]);
  });

  it('pays for logging a weigh-in and for all the medication taken', () => {
    expect(pointsFor(WaypointSource.Weight)).toBe(5);
    expect(pointsFor(WaypointSource.Medication)).toBe(10);
  });

  it('lists the three meals as one line', () => {
    const labels = listedRules().map((r) => r.label);
    expect(labels).toContain('Logging each meal');
    expect(labels).not.toContain('Logging lunch');
    expect(labels).not.toContain('Logging dinner');
  });
});

describe('streak bonuses', () => {
  it('pays only at a milestone, and more the longer the streak', () => {
    expect(streakBonus(6)).toBe(0);
    expect(streakBonus(7)).toBe(25);
    expect(streakBonus(8)).toBe(0);
    expect(streakBonus(30)).toBe(75);
    const pay = StreakBonuses.MILESTONES.map((m) => m.points);
    expect([...pay].sort((a, b) => a - b)).toEqual(pay);
  });

  it('starts the rule list at the first milestone', () => {
    expect(pointsFor(WaypointSource.Streak)).toBe(streakBonus(7));
  });
});

describe('the ledger check in the database', () => {
  // The newest migration that sets the points rule is the one in force.
  const migrations = join(__dirname, '../../../supabase/migrations');
  const latest = readdirSync(migrations)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .reverse()
    .map((f) => readFileSync(join(migrations, f), 'utf8'))
    .find((sql) => sql.includes('waypoint_events_points_check check'))!;

  it('allows every source the app can award, at the points the app awards', () => {
    for (const rule of WaypointRules.ALL) {
      expect(latest).toContain(`'${rule.id}'`);
    }
    for (const m of StreakBonuses.MILESTONES) {
      expect(latest).toMatch(new RegExp(`\\b${m.points}\\b`));
    }
  });

  it('pays a fixed amount per source', () => {
    const fixed = (points: number, ids: WaypointSource[]) =>
      expect(ids.map(pointsFor)).toEqual(ids.map(() => points));
    fixed(40, [WaypointSource.Steps]);
    fixed(15, [WaypointSource.Meals]);
    fixed(10, [
      WaypointSource.Rest,
      WaypointSource.Water,
      WaypointSource.Mood,
      WaypointSource.Medication,
      WaypointSource.Movement,
    ]);
    fixed(5, [WaypointSource.Weight, WaypointSource.Breakfast, WaypointSource.Lunch, WaypointSource.Dinner]);
  });
});
