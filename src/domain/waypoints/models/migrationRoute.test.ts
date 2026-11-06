import {
  type GeoPoint,
  MigrationPhase,
  MigrationRoute,
} from './migrationRoute';

const EARTH_RADIUS_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in km. */
function greatCircle(a: GeoPoint, b: GeoPoint): number {
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) *
      Math.cos(rad(b.lat)) *
      Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const { STOPS, PHASE_KM, COLONY, KM_PER_WAYPOINT } = MigrationRoute;

describe('MigrationRoute', () => {
  it('runs in order, south, then winter, then north, ending back at the colony', () => {
    const order = [
      MigrationPhase.South,
      MigrationPhase.Winter,
      MigrationPhase.North,
    ];
    const phases = STOPS.map((s) => order.indexOf(s.phase));
    expect(phases).toEqual([...phases].sort((a, b) => a - b));
    expect(STOPS[STOPS.length - 1].at).toEqual(COLONY);
    expect(new Set(STOPS.map((s) => s.id)).size).toBe(STOPS.length);
  });

  it('makes each phase as long as the tracked terns flew it', () => {
    let start = 0;
    for (const phase of Object.values(MigrationPhase)) {
      const end = Math.max(
        ...STOPS.filter((s) => s.phase === phase).map((s) => s.km),
      );
      expect(end - start).toBe(PHASE_KM[phase]);
      start = end;
    }
  });

  it('shares each phase out by the length of its legs', () => {
    const legs = STOPS.map((s, i) => ({
      ...s,
      leg: greatCircle(i === 0 ? COLONY : STOPS[i - 1].at, s.at),
    }));
    const phaseLength = (phase: MigrationPhase) =>
      legs.filter((l) => l.phase === phase).reduce((sum, l) => sum + l.leg, 0);
    let km = 0;
    for (const l of legs) {
      km += (l.leg / phaseLength(l.phase)) * PHASE_KM[l.phase];
      // Rounded to 50 km, and allowed a little for a stop nudged since.
      expect(Math.abs(l.km - km)).toBeLessThan(150);
    }
  });

  it('never leaves more than about four weeks between stops at a typical pace', () => {
    const TYPICAL_DAY = 75;
    STOPS.forEach((s, i) => {
      const leg = (s.km - (i === 0 ? 0 : STOPS[i - 1].km)) / KM_PER_WAYPOINT;
      expect(leg / TYPICAL_DAY).toBeLessThanOrEqual(28);
    });
  });
});
