import { pointAlongRoute, RouteShape } from './routePoints';

describe('pointAlongRoute', () => {
  it('starts and ends where the path does', () => {
    expect(pointAlongRoute(0)).toEqual({ x: 6, y: 34 });
    const end = pointAlongRoute(1);
    expect(end.x).toBeCloseTo(272);
    expect(end.y).toBeCloseTo(7);
  });

  it('keeps fractions outside 0–1 on the path', () => {
    expect(pointAlongRoute(-1)).toEqual(pointAlongRoute(0));
    expect(pointAlongRoute(2)).toEqual(pointAlongRoute(1));
  });

  it('moves right the whole way, as the route does', () => {
    let x = -Infinity;
    for (let f = 0; f <= 1; f += 0.02) {
      const p = pointAlongRoute(f);
      expect(p.x).toBeGreaterThan(x);
      x = p.x;
    }
  });

  it('measures about the length the line is drawn with', () => {
    expect(Math.abs(RouteShape.LENGTH - 273)).toBeLessThan(6);
  });
});
