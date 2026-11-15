/**
 * Builds the shapes for the maps on Journey: coastlines from Natural Earth (public domain,
 * via the world-atlas package) and each migration route through its stops
 * (`routeMilestones`), projected into the hero's drawing size. The Greenland route (everyone's
 * own journey) gets a flat map and a globe; the Dutch route, which reaches East Antarctica on
 * the far side of the world, gets a flat map only, since no one view of a globe shows both
 * ends of it. The app only draws the result, so it needs no map data or projection code of
 * its own.
 *
 * Run it after moving a stop or changing a projection, and commit the output. The map
 * packages are only needed here, so they're installed for the run and not kept in
 * package.json (`npm ci` clears them again):
 *
 *   npm install --no-save d3-geo@3 topojson-client@3 world-atlas@2
 *   npx tsx scripts/buildJourneyMap.ts
 *   npx prettier --write src/journey/components/JourneyMap/models/journeyMapShapes.ts
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

import {
  type RouteMilestone,
  routeMilestones,
} from '../src/domain/waypoints/models/milestone';
import { RouteId } from '../src/domain/waypoints/models/routes';

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

/** A flat map of `window` ([west, south, east, north]), centred on `centreLon`. */
function flat(
  window: [number, number, number, number],
  centreLon: number,
): GeoProjection {
  const [w, s, e, n] = window;
  const outline = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [w, s],
        [e, s],
        [e, n],
        [w, n],
        [w, s],
      ],
    ],
  };
  return geoNaturalEarth1()
    .rotate([-centreLon, 0])
    .fitExtent(
      [
        [6, 6],
        [WIDTH - 6, MAP_HEIGHT - 6],
      ],
      outline,
    )
    .clipExtent([
      [0, 0],
      [WIDTH, MAP_HEIGHT],
    ]);
}

/** The globe: the Atlantic seen from above the middle of it. */
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

/**
 * Leg `i` of a route's loop (from stop `i - 1`, or the colony, to stop `i`) as an arc: a
 * quadratic curve whose middle bows toward the centre of the loop by `bow` of the leg's
 * length. Bowing inward keeps the Greenland route's arcs over the ocean instead of across
 * Africa or the Americas; the Dutch route goes down and back up the same ocean, so it bows
 * only a little. Worked in degrees, which is fine here since no route crosses the date line
 * or a pole.
 */
function curvedLeg(
  loop: readonly (readonly [number, number])[],
  bow: number,
  i: number,
): (t: number) => [number, number] {
  const centre = [0, 1].map(
    (d) => loop.reduce((sum, p) => sum + p[d], 0) / loop.length,
  );
  const n = loop.length;
  const from = loop[(i - 1 + n) % n];
  const to = loop[i];
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  // A perpendicular to the leg, turned to face the centre of the loop.
  let [nx, ny] = [-dy, dx];
  if (nx * (centre[0] - mid[0]) + ny * (centre[1] - mid[1]) < 0) {
    [nx, ny] = [-nx, -ny];
  }
  const bend = [mid[0] + nx * bow, mid[1] + ny * bow];
  return (t) => {
    const [a, b, c] = [(1 - t) * (1 - t), 2 * (1 - t) * t, t * t];
    return [
      a * from[0] + b * bend[0] + c * to[0],
      a * from[1] + b * bend[1] + c * to[1],
    ];
  };
}

function shape(
  stops: RouteMilestone[],
  bow: number,
  projection: GeoProjection,
  height: number,
  withSphere: boolean,
) {
  const loop = stops.map((s) => [s.at.lon, s.at.lat] as const);
  const path = geoPath(projection).digits(1);
  // The colony is where every migration starts and ends: the last stop.
  const colony = stops[stops.length - 1].at;
  const points = [colony, ...stops.map((s) => s.at)];
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
  for (let i = 1; i < points.length; i++) {
    const leg = curvedLeg(loop, bow, i - 1);
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

const greenland = routeMilestones(RouteId.Greenland);
const netherlands = routeMilestones(RouteId.Netherlands);

/** The Atlantic from the Arctic to the Weddell Sea, centred a little west of Greenwich. */
const map = shape(greenland, 0.22, flat([-62, -75, 28, 78], -17), MAP_HEIGHT, false);
const globeShape = shape(greenland, 0.22, globe(), GLOBE_HEIGHT, true);
/** From the North Sea to East Antarctica across three oceans, centred on the Indian Ocean. */
const netherlandsMap = shape(
  netherlands,
  0.08,
  flat([-40, -72, 140, 58], 50),
  MAP_HEIGHT,
  false,
);

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
  /** The Dutch route, on a flat map only: no one view of a globe shows both its ends. */
  static readonly NETHERLANDS_MAP: MapShape = ${JSON.stringify(netherlandsMap)};
}
`,
);
console.log(
  `Wrote ${OUT}: Greenland ${map.route.length / 2} route points, Netherlands ${netherlandsMap.route.length / 2}.`,
);
