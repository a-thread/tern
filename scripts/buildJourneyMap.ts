/**
 * Builds the shapes for the map on Journey: coastlines from Natural Earth (public domain,
 * via the world-atlas package) and the migration route through `Milestones.STOPS`, projected
 * twice (a flat map and a globe) into the hero's drawing size. The app only draws the result,
 * so it needs no map data or projection code of its own.
 *
 * Run it after moving a stop or changing a projection, and commit the output. The map
 * packages are only needed here, so they're installed for the run and not kept in
 * package.json (`npm ci` clears them again):
 *
 *   npm install --no-save d3-geo@3 topojson-client@3 world-atlas@2
 *   npx tsx scripts/buildJourneyMap.ts
 *
 * Being outside package.json, this file is left out of typecheck and lint.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  geoGraticule10,
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
  type GeoProjection,
} from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryObject, Topology } from 'topojson-specification';
import land110m from 'world-atlas/land-110m.json';

import { Milestones } from '../src/domain/waypoints/models/milestone';

const WIDTH = 340;
/** The flat map is shorter: it fits the whole route in less height than the globe. */
const MAP_HEIGHT = 200;
const GLOBE_HEIGHT = 280;
/** Points along each leg between two stops, enough for the curve to look smooth. */
const LEG_POINTS = 24;
const OUT = join(
  __dirname,
  '../src/journey/components/JourneyMap/models/journeyMapShapes.ts',
);

const atlas = land110m as unknown as Topology<{ land: GeometryObject }>;
const land = feature(atlas, atlas.objects.land);

/** The flat map: the Atlantic from the Arctic to the Weddell Sea, centred a little west of Greenwich. */
function flat(): GeoProjection {
  const window = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [-62, -75],
        [28, -75],
        [28, 78],
        [-62, 78],
        [-62, -75],
      ],
    ],
  };
  return geoNaturalEarth1()
    .rotate([17, 0])
    .fitExtent(
      [
        [6, 6],
        [WIDTH - 6, MAP_HEIGHT - 6],
      ],
      window,
    )
    .clipExtent([
      [0, 0],
      [WIDTH, MAP_HEIGHT],
    ]);
}

/** The globe: the same ocean seen from above the middle of it. */
function globe(): GeoProjection {
  const r = GLOBE_HEIGHT / 2 - 4;
  return geoOrthographic()
    .rotate([22, -2])
    .fitExtent(
      [
        [WIDTH / 2 - r, GLOBE_HEIGHT / 2 - r],
        [WIDTH / 2 + r, GLOBE_HEIGHT / 2 + r],
      ],
      { type: 'Sphere' },
    );
}

const round = (n: number, places: number) => Number(n.toFixed(places));

/** The migration as a loop of stops: the colony (also the last stop), then each stop in turn. */
const LOOP = Milestones.STOPS.map((s) => [s.at.lon, s.at.lat] as const);

/** The middle of the loop, which every leg bows toward. */
const CENTRE = [0, 1].map(
  (d) => LOOP.reduce((sum, p) => sum + p[d], 0) / LOOP.length,
);

/** How far each leg bows out of a straight line, as a share of its length. */
const BOW = 0.22;

/**
 * Leg `i` of the loop (from stop `i - 1`, or the colony, to stop `i`) as an arc: a quadratic
 * curve whose middle bows toward the centre of the loop by `BOW` of the leg's length. Bowing
 * inward keeps the arcs over the ocean instead of across Africa or the Americas. Worked in
 * degrees, which is fine here since the route never crosses the date line or a pole.
 */
function curvedLeg(i: number): (t: number) => [number, number] {
  const n = LOOP.length;
  const from = LOOP[(i - 1 + n) % n];
  const to = LOOP[i];
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  // A perpendicular to the leg, turned to face the centre of the loop.
  let [nx, ny] = [-dy, dx];
  if (nx * (CENTRE[0] - mid[0]) + ny * (CENTRE[1] - mid[1]) < 0) {
    [nx, ny] = [-nx, -ny];
  }
  const bend = [mid[0] + nx * BOW, mid[1] + ny * BOW];
  return (t) => {
    const [a, b, c] = [(1 - t) * (1 - t), 2 * (1 - t) * t, t * t];
    return [
      a * from[0] + b * bend[0] + c * to[0],
      a * from[1] + b * bend[1] + c * to[1],
    ];
  };
}

function shape(projection: GeoProjection, height: number, withSphere: boolean) {
  const path = geoPath(projection).digits(1);
  // The colony is where every migration starts and ends: the last stop.
  const colony = Milestones.STOPS[Milestones.STOPS.length - 1].at;
  const stops = [colony, ...Milestones.STOPS.map((s) => s.at)];
  const route: number[] = [];
  const lengths: number[] = [];
  const add = (lon: number, lat: number) => {
    const xy = projection([lon, lat]);
    if (!xy) throw new Error(`${lat},${lon} is hidden on this projection`);
    const [x, y] = [round(xy[0], 1), round(xy[1], 1)];
    const n = route.length;
    const prev = n
      ? lengths[lengths.length - 1] +
        Math.hypot(x - route[n - 2], y - route[n - 1])
      : 0;
    route.push(x, y);
    lengths.push(round(prev, 2));
  };
  add(colony.lon, colony.lat);
  for (let i = 1; i < stops.length; i++) {
    const leg = curvedLeg(i - 1);
    for (let k = 1; k <= LEG_POINTS; k++) {
      const [lon, lat] = leg(k / LEG_POINTS);
      add(lon, lat);
    }
  }
  return {
    height,
    sphere: withSphere ? path({ type: 'Sphere' }) : null,
    // geoPath gives null only for something with nothing to draw.
    graticule: path(geoGraticule10()) ?? '',
    land: path(land) ?? '',
    route,
    lengths,
  };
}

const map = shape(flat(), MAP_HEIGHT, false);
const globeShape = shape(globe(), GLOBE_HEIGHT, true);

writeFileSync(
  OUT,
  `// Generated by scripts/buildJourneyMap.ts from Natural Earth (public domain). Don't edit by hand.

export type MapShape = {
  /** The drawing's height; every view is \`JourneyMapShapes.WIDTH\` wide. */
  height: number;
  /** The globe's outline; null on the flat map. */
  sphere: string | null;
  /** Lines of latitude and longitude every 10 degrees. */
  graticule: string;
  land: string;
  /** The route as x, y pairs: the colony, then \`LEG_POINTS\` points for each leg in stop order. */
  route: number[];
  /** Distance along the route to each point, for drawing part of it. */
  lengths: number[];
};

/** The Journey map's shapes: each view is \`WIDTH\` wide and its own \`height\` tall. */
export class JourneyMapShapes {
  static readonly WIDTH = ${WIDTH};
  static readonly LEG_POINTS = ${LEG_POINTS};
  static readonly MAP: MapShape = ${JSON.stringify(map)};
  static readonly GLOBE: MapShape = ${JSON.stringify(globeShape)};
}
`,
);
console.log(
  `Wrote ${OUT}: map land ${map.land.length} chars, globe land ${globeShape.land.length} chars, ${map.route.length / 2} route points each.`,
);
