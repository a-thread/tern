import { Milestones } from '@/domain/waypoints/models/milestone';
import { JourneyMapShapes } from '../models/journeyMapShapes';
import {
  nearestStop,
  pointAt,
  routeIndex,
  routePointCount,
  stopIndex,
} from './routeAt';

const shapes = [JourneyMapShapes.MAP, JourneyMapShapes.GLOBE];
const fraction = (waypoints: number) => waypoints / Milestones.MIGRATION_LENGTH;

describe('the generated shapes', () => {
  it('make the flat map shorter than the globe', () => {
    expect(JourneyMapShapes.MAP.height).toBeLessThan(
      JourneyMapShapes.GLOBE.height,
    );
  });

  it.each(shapes)(
    'have the colony plus a full set of points for every leg',
    (shape) => {
      expect(routePointCount(shape)).toBe(
        1 + Milestones.STOPS.length * JourneyMapShapes.LEG_POINTS,
      );
      expect(shape.lengths).toHaveLength(routePointCount(shape));
      expect(shape.land.length).toBeGreaterThan(1000);
    },
  );

  it.each(shapes)('keep every point inside the drawing', (shape) => {
    for (let i = 0; i < shape.route.length; i += 2) {
      expect(shape.route[i]).toBeGreaterThanOrEqual(0);
      expect(shape.route[i]).toBeLessThanOrEqual(JourneyMapShapes.WIDTH);
      expect(shape.route[i + 1]).toBeGreaterThanOrEqual(0);
      expect(shape.route[i + 1]).toBeLessThanOrEqual(shape.height);
    }
  });

  it.each(shapes)('start and end the migration at the colony', (shape) => {
    const start = pointAt(shape, 0);
    const end = pointAt(shape, routePointCount(shape) - 1);
    expect(end.x).toBeCloseTo(start.x);
    expect(end.y).toBeCloseTo(start.y);
  });
});

describe('routeIndex', () => {
  it('puts each stop exactly on its point', () => {
    Milestones.STOPS.forEach((stop, i) => {
      expect(routeIndex(fraction(stop.waypoints))).toBeCloseTo(stopIndex(i));
    });
  });

  it('runs from the colony to home, and no further', () => {
    expect(routeIndex(0)).toBe(0);
    expect(routeIndex(1)).toBe(stopIndex(Milestones.STOPS.length - 1));
    expect(routeIndex(2)).toBe(routeIndex(1));
  });

  it('moves along a leg in step with the waypoints', () => {
    // Halfway from Iceland (250) to the stopover (600).
    const half = routeIndex(fraction(425));
    expect(half).toBeCloseTo((stopIndex(0) + stopIndex(1)) / 2);
  });
});

describe('nearestStop', () => {
  it.each(shapes)('finds each stop from its own spot', (shape) => {
    Milestones.STOPS.slice(0, -1).forEach((_, i) => {
      const p = pointAt(shape, stopIndex(i));
      expect(nearestStop(shape, p.x, p.y)).toBe(i);
    });
  });
});
