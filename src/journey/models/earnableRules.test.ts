import { WaypointSource } from '../../domain/waypoints/models/waypoint';
import { earnableRules, type Earnable } from './earnableRules';

const all: Earnable = {
  food: true,
  mood: true,
  water: true,
  movement: true,
  weight: true,
  medication: true,
  goal: true,
  rest: true,
};
const ids = (on: Earnable) => earnableRules(on).map((r) => r.id);

describe('earnableRules', () => {
  it('lists every rule when everything is on', () => {
    expect(ids(all)).toHaveLength(10);
  });

  it('drops the goal day and streak bonus when no goal day can be reached', () => {
    const left = ids({ ...all, goal: false });
    expect(left).not.toContain(WaypointSource.Steps);
    expect(left).not.toContain(WaypointSource.Streak);
  });

  it('drops the rest day rule with no rest days allowed', () => {
    expect(ids({ ...all, rest: false })).not.toContain(WaypointSource.Rest);
  });

  it('drops both meal lines with food off', () => {
    const left = ids({ ...all, food: false });
    expect(left).not.toContain(WaypointSource.Meals);
    expect(left).not.toContain(WaypointSource.Breakfast);
  });
});
