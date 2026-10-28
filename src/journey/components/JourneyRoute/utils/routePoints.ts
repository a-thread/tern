export type Point = { x: number; y: number };

/** A cubic Bézier: start, two control points, end. */
type Cubic = [Point, Point, Point, Point];

/** A point along the path, with the distance travelled to reach it. */
type Sample = { at: Point; dist: number };

/** The route's path, written out as cubics (each `S` with its control point reflected). */
export class RouteShape {
  static readonly PATH =
    'M6,34 C 48,34 58,9 104,9 S 172,30 206,17 S 254,11 272,7';

  static readonly SEGMENTS: readonly Cubic[] = [
    [
      { x: 6, y: 34 },
      { x: 48, y: 34 },
      { x: 58, y: 9 },
      { x: 104, y: 9 },
    ],
    [
      { x: 104, y: 9 },
      { x: 150, y: 9 },
      { x: 172, y: 30 },
      { x: 206, y: 17 },
    ],
    [
      { x: 206, y: 17 },
      { x: 240, y: 4 },
      { x: 254, y: 11 },
      { x: 272, y: 7 },
    ],
  ];

  /** Samples per segment when measuring along the path. */
  static readonly STEPS = 64;

  /** Points along the path, measured once. */
  static readonly SAMPLES: readonly Sample[] = measure(
    RouteShape.SEGMENTS,
    RouteShape.STEPS,
  );

  /** The path's length, in viewBox units. */
  static readonly LENGTH =
    RouteShape.SAMPLES[RouteShape.SAMPLES.length - 1].dist;
}

function cubicAt([a, b, c, d]: Cubic, t: number): Point {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return {
    x: w[0] * a.x + w[1] * b.x + w[2] * c.x + w[3] * d.x,
    y: w[0] * a.y + w[1] * b.y + w[2] * c.y + w[3] * d.y,
  };
}

/** Walks the segments in `steps` short straight pieces each, adding up the distance. */
function measure(segments: readonly Cubic[], steps: number): Sample[] {
  const out = [{ at: segments[0][0], dist: 0 }];
  for (const seg of segments) {
    for (let i = 1; i <= steps; i++) {
      const at = cubicAt(seg, i / steps);
      const prev = out[out.length - 1];
      out.push({
        at,
        dist: prev.dist + Math.hypot(at.x - prev.at.x, at.y - prev.at.y),
      });
    }
  }
  return out;
}

/** The point `fraction` (0 to 1) of the way along the route by distance, as the line draws. */
export function pointAlongRoute(fraction: number): Point {
  const samples = RouteShape.SAMPLES;
  const target = Math.min(Math.max(fraction, 0), 1) * RouteShape.LENGTH;
  const i = samples.findIndex((s) => s.dist >= target);
  if (i <= 0) return samples[0].at;
  const a = samples[i - 1];
  const b = samples[i];
  const t = (target - a.dist) / (b.dist - a.dist || 1);
  return {
    x: a.at.x + (b.at.x - a.at.x) * t,
    y: a.at.y + (b.at.y - a.at.y) * t,
  };
}
