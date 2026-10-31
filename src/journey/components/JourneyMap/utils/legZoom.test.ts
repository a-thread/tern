import { Milestones } from '@/domain/waypoints/models/milestone';
import { JourneyMapShapes } from '../models/journeyMapShapes';
import { legZoom } from './legZoom';
import { NO_ZOOM, toFrame, ZoomLimits } from './mapZoom';
import { pointAt, stopIndex } from './routeAt';

const shapes = [JourneyMapShapes.MAP, JourneyMapShapes.GLOBE];
const WIDTH = 340;
// The drawing is as wide as the frame here, so a drawing unit is a point.
const heightOf = (shape: (typeof shapes)[number]) => shape.height;
/** Halfway (by waypoints) between stop `i - 1`, or the colony, and stop `i`. */
const midway = (i: number) => {
  const from = i === 0 ? 0 : Milestones.STOPS[i - 1].waypoints;
  return (
    (from + Milestones.STOPS[i].waypoints) / 2 / Milestones.MIGRATION_LENGTH
  );
};
/** Where leg `i` starts and ends in the frame at zoom `z`. */
const ends = (
  shape: (typeof shapes)[number],
  i: number,
  z = legZoom(shape, midway(i), WIDTH, heightOf(shape)),
) =>
  [i === 0 ? 0 : stopIndex(i - 1), stopIndex(i)].map((index) => {
    const p = pointAt(shape, index);
    return toFrame(z, { x: p.x, y: p.y });
  });

describe('legZoom', () => {
  it.each(shapes)('turns every leg to run left to right, level', (shape) => {
    Milestones.STOPS.forEach((_, i) => {
      const [from, to] = ends(shape, i);
      expect(to.x).toBeGreaterThan(from.x);
      expect(to.y).toBeCloseTo(from.y, 3);
    });
  });

  it.each(shapes)('keeps both ends of every leg in the frame', (shape) => {
    Milestones.STOPS.forEach((_, i) => {
      for (const p of ends(shape, i)) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(WIDTH);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(heightOf(shape));
      }
    });
  });

  it.each(shapes)('zooms in, but no further than the limit', (shape) => {
    Milestones.STOPS.forEach((_, i) => {
      const z = legZoom(shape, midway(i), WIDTH, heightOf(shape));
      expect(z.scale).toBeGreaterThanOrEqual(1);
      expect(z.scale).toBeLessThanOrEqual(ZoomLimits.MAX);
    });
  });

  it('shows the whole map before the frame has a size', () => {
    expect(legZoom(JourneyMapShapes.MAP, 0.5, 0, 0)).toEqual(NO_ZOOM);
  });
});
