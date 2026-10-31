import {
  clampZoom,
  isWhole,
  NO_ZOOM,
  shortAngle,
  toFrame,
  toMap,
  zoomAbout,
  zoomBetween,
  ZoomLimits,
  zoomThen,
} from './mapZoom';

const W = 300;
const H = 200;

const expectPoint = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => {
  expect(a.x).toBeCloseTo(b.x);
  expect(a.y).toBeCloseTo(b.y);
};

describe('zoomAbout', () => {
  it('keeps the spot under the fingers where it was', () => {
    const at = { x: 120, y: 80 };
    const z = zoomAbout(NO_ZOOM, at, at, 2, W, H);
    expect(z.scale).toBe(2);
    expectPoint(toFrame(z, toMap(NO_ZOOM, at)), at);
  });

  it('does the same on a turned map, and keeps the turn', () => {
    const start = { scale: 2, x: 40, y: -30, rotate: 35 };
    const at = { x: 150, y: 90 };
    const z = zoomAbout(start, at, at, 3, W, H);
    expect(z.rotate).toBe(35);
    expectPoint(toFrame(z, toMap(start, at)), at);
  });

  it('pans with the fingers as it zooms', () => {
    const z = zoomAbout(
      NO_ZOOM,
      { x: 150, y: 100 },
      { x: 140, y: 90 },
      2,
      W,
      H,
    );
    expectPoint(toFrame(z, { x: 150, y: 100 }), { x: 140, y: 90 });
  });

  it('goes no further than the limits', () => {
    const at = { x: 10, y: 10 };
    expect(zoomAbout(NO_ZOOM, at, at, 10, W, H).scale).toBe(ZoomLimits.MAX);
    expect(zoomAbout(NO_ZOOM, at, at, 0.2, W, H)).toEqual(NO_ZOOM);
  });
});

describe('clampZoom', () => {
  it('never lets an edge of the map into the frame, north up', () => {
    expect(clampZoom({ scale: 2, x: 50, y: 50, rotate: 0 }, W, H)).toEqual({
      scale: 2,
      x: 0,
      y: 0,
      rotate: 0,
    });
    expect(
      clampZoom({ scale: 2, x: -1000, y: -1000, rotate: 0 }, W, H),
    ).toEqual({ scale: 2, x: -W, y: -H, rotate: 0 });
  });

  it('has nowhere to pan at normal size', () => {
    expect(clampZoom({ scale: 1, x: -40, y: 20, rotate: 0 }, W, H)).toEqual(
      NO_ZOOM,
    );
  });

  it('leaves a turned map alone while the middle of the frame is over it', () => {
    // Turned about the middle of the frame, so the middle stays over the map's middle.
    const z = zoomAbout(
      { ...NO_ZOOM, rotate: 30 },
      { x: W / 2, y: H / 2 },
      { x: W / 2, y: H / 2 },
      2,
      W,
      H,
    );
    const kept = clampZoom(z, W, H);
    expect(kept.x).toBeCloseTo(z.x);
    expect(kept.y).toBeCloseTo(z.y);
    expect(clampZoom({ ...z, scale: 9 }, W, H).scale).toBe(ZoomLimits.MAX);
  });

  it('never lets a turned map be dragged out of the frame', () => {
    const middle = { x: W / 2, y: H / 2 };
    const z = clampZoom({ scale: 2, x: 5000, y: -5000, rotate: 30 }, W, H);
    const under = toMap(z, middle);
    expect(under.x).toBeGreaterThanOrEqual(-1e-6);
    expect(under.x).toBeLessThanOrEqual(W + 1e-6);
    expect(under.y).toBeGreaterThanOrEqual(-1e-6);
    expect(under.y).toBeLessThanOrEqual(H + 1e-6);
    expect(z.rotate).toBe(30);
  });
});

describe('zoomThen', () => {
  it('undoes zoomBetween', () => {
    const from = { scale: 1.5, x: 20, y: -10, rotate: 15 };
    const to = { scale: 3, x: -60, y: 40, rotate: -70 };
    const back = zoomThen(from, zoomBetween(from, to));
    expect(back.scale).toBeCloseTo(to.scale);
    expect(shortAngle(back.rotate - to.rotate)).toBeCloseTo(0);
    expect(back.x).toBeCloseTo(to.x);
    expect(back.y).toBeCloseTo(to.y);
  });
});

describe('toMap and toFrame', () => {
  it('undo each other, turned or not', () => {
    for (const rotate of [0, 47, -120]) {
      const z = { scale: 2.2, x: -80, y: -35, rotate };
      const p = { x: 61, y: 47 };
      expectPoint(toMap(z, toFrame(z, p)), p);
    }
  });
});

describe('zoomBetween', () => {
  it('moves what was drawn at one zoom to where it shows at another', () => {
    const from = { scale: 1.5, x: 20, y: -10, rotate: 15 };
    const to = { scale: 3, x: -60, y: 40, rotate: -70 };
    const move = zoomBetween(from, to);
    const p = { x: 33, y: 71 };
    expectPoint(toFrame(move, toFrame(from, p)), toFrame(to, p));
  });

  it('turns the short way round', () => {
    expect(
      zoomBetween({ ...NO_ZOOM, rotate: 170 }, { ...NO_ZOOM, rotate: -170 })
        .rotate,
    ).toBeCloseTo(20);
  });
});

describe('isWhole', () => {
  it('is the whole route only at normal size and north up', () => {
    expect(isWhole(NO_ZOOM)).toBe(true);
    expect(isWhole({ ...NO_ZOOM, scale: 2 })).toBe(false);
    expect(isWhole({ ...NO_ZOOM, rotate: 40 })).toBe(false);
    expect(isWhole({ ...NO_ZOOM, rotate: 360 })).toBe(true);
  });

  it('takes angles the short way round', () => {
    expect(shortAngle(350)).toBeCloseTo(-10);
    expect(shortAngle(-190)).toBeCloseTo(170);
  });
});
