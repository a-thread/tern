import { Milestones } from '@/domain/waypoints/models/milestone';
import { JourneyMapShapes, type MapShape } from '../models/journeyMapShapes';

/** A spot on the drawn route: where it is, how far along the line, and which way it heads. */
export type RoutePoint = {
  x: number;
  y: number;
  length: number;
  angle: number;
};

/** How many points the route has: the colony, then `LEG_POINTS` for each leg. */
export const routePointCount = (shape: MapShape) => shape.route.length / 2;

/**
 * Where on the route `progress` (0 to 1 through one migration, as `migrationProgress` gives it)
 * falls, as a fractional point index. Each leg runs between two stops' waypoint totals, so a
 * long leg (Cape Town to the Weddell Sea) takes as many waypoints as it says it does.
 */
export function routeIndex(progress: number): number {
  const w = Math.min(Math.max(progress, 0), 1) * Milestones.MIGRATION_LENGTH;
  const n = JourneyMapShapes.LEG_POINTS;
  for (let i = 0; i < Milestones.STOPS.length; i++) {
    const from = i === 0 ? 0 : Milestones.STOPS[i - 1].waypoints;
    const to = Milestones.STOPS[i].waypoints;
    if (w <= to) return (i + (w - from) / (to - from)) * n;
  }
  return Milestones.STOPS.length * n;
}

/** The point index of stop `i` in `Milestones.STOPS`. */
export const stopIndex = (i: number) => (i + 1) * JourneyMapShapes.LEG_POINTS;

/** The route at a fractional point index, between the two points either side of it. */
export function pointAt(shape: MapShape, index: number): RoutePoint {
  const last = routePointCount(shape) - 1;
  const at = Math.min(Math.max(index, 0), last);
  const i = Math.min(Math.floor(at), last - 1);
  const k = at - i;
  const [x0, y0, x1, y1] = shape.route.slice(i * 2, i * 2 + 4);
  return {
    x: x0 + (x1 - x0) * k,
    y: y0 + (y1 - y0) * k,
    length: shape.lengths[i] + (shape.lengths[i + 1] - shape.lengths[i]) * k,
    // The way the next stretch heads, in degrees clockwise from east.
    angle: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI,
  };
}

/** The stop (an index into `Milestones.STOPS`) drawn nearest to `x`, `y`. */
export function nearestStop(shape: MapShape, x: number, y: number): number {
  let best = 0;
  let bestDistance = Infinity;
  Milestones.STOPS.forEach((_, i) => {
    const p = pointAt(shape, stopIndex(i));
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}

/** The route as one SVG path, for the line under and over the tern. */
export function routePath(shape: MapShape): string {
  const r = shape.route;
  let d = `M${r[0]},${r[1]}`;
  for (let i = 2; i < r.length; i += 2) d += `L${r[i]},${r[i + 1]}`;
  return d;
}
