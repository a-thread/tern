import { poseAt, RestScenes, settledPose } from './restScene';

const { PERCH, FAR, FLIGHT_MS, SKY_MS } = RestScenes;

describe('the rest day scene', () => {
  it('starts settled: dusk, the tern on its perch with the wing folded', () => {
    const p = settledPose();
    expect(p.dusk).toBe(1);
    expect(p.starOpacity).toBe(1);
    expect(p.sunDrop).toBe(RestScenes.SUN_DROP);
    expect(p.bird).toMatchObject({ x: PERCH.x, y: PERCH.y, fold: 1, facing: -1, pitch: 0 });
    expect(p.skyColor).toBe(RestScenes.DUSK.sky.toLowerCase());
    expect(p.waterColor).toBe(RestScenes.DUSK.water.toLowerCase());
  });

  describe('arriving', () => {
    it('begins with a day sky and the tern off the edge, wings working', () => {
      const p = poseAt('arriving', 0, 0);
      expect(p.dusk).toBe(0);
      expect(p.skyColor).toBe(RestScenes.DAY.sky.toLowerCase());
      expect(p.sunDrop).toBe(0);
      expect(p.starOpacity).toBe(0);
      expect(p.bird).toMatchObject({ x: FAR.x, y: FAR.y, fold: 0 });
    });

    it('lands on the perch with a folded wing, and the sky settled', () => {
      const p = poseAt('arriving', FLIGHT_MS, 0);
      expect(p.bird.x).toBeCloseTo(PERCH.x);
      expect(p.bird.y).toBeCloseTo(PERCH.y);
      expect(p.bird.fold).toBe(1);
      expect(p.dusk).toBe(1);
    });

    it('comes in from the right and down, nose down', () => {
      const mid = poseAt('arriving', FLIGHT_MS * 0.4, 0).bird;
      expect(mid.x).toBeLessThan(FAR.x);
      expect(mid.x).toBeGreaterThan(PERCH.x);
      expect(mid.y).toBeGreaterThan(FAR.y);
      expect(mid.facing).toBe(-1);
      expect(mid.pitch).toBeLessThan(0); // counter-clockwise on a left-facing bird is nose down
    });

    it('moves the sky along no faster than the flight', () => {
      expect(poseAt('arriving', SKY_MS / 2, 0).dusk).toBeCloseTo(0.5, 1);
      expect(poseAt('arriving', SKY_MS, 0).dusk).toBe(1);
    });

    it('flaps while in the air', () => {
      const a = poseAt('arriving', 100, 0).bird.wingScaleY;
      const b = poseAt('arriving', 100 + 1000 / RestScenes.WINGBEAT_HZ / 2, 0).bird.wingScaleY;
      expect(a * b).toBeLessThan(0); // up, then down
    });
  });

  describe('leaving', () => {
    it('starts on the perch at dusk and turns to face the way it flies', () => {
      const start = poseAt('leaving', 0, 0).bird;
      expect(start).toMatchObject({ x: PERCH.x, y: PERCH.y, facing: -1 });
      expect(poseAt('leaving', 400, 0).bird.facing).toBe(1);
      expect(poseAt('leaving', 0, 0).dusk).toBe(1);
    });

    it('flies off to the right and climbs, nose up', () => {
      const mid = poseAt('leaving', FLIGHT_MS * 0.5, 0).bird;
      expect(mid.x).toBeGreaterThan(PERCH.x);
      expect(mid.y).toBeLessThan(PERCH.y);
      expect(mid.pitch).toBeLessThan(0);
    });

    it('ends off the edge in a day sky', () => {
      const p = poseAt('leaving', FLIGHT_MS, 0);
      expect(p.bird.x).toBeCloseTo(FAR.x);
      expect(p.dusk).toBe(0);
    });
  });

  describe('idle motion', () => {
    it('breathes, tilts its head and blinks while resting, but not in flight', () => {
      const breaths = [0, 1000, 2000, 3000].map((ms) => poseAt('settled', 0, ms).bird.breathY);
      expect(Math.max(...breaths)).toBeGreaterThan(Math.min(...breaths));
      expect(poseAt('settled', 0, 11_000 * 0.72).bird.headTilt).toBeCloseTo(-15, 0);
      expect(poseAt('settled', 0, 5500 * 0.96).bird.blink).toBeCloseTo(0.1, 1);
      const flying = poseAt('arriving', 500, 3000).bird;
      expect(flying).toMatchObject({ breathX: 1, breathY: 1, headTilt: 0, blink: 1, tailFlick: 0 });
    });

    it('keeps the water and sun moving, always within a small range', () => {
      for (let ms = 0; ms < 20_000; ms += 700) {
        const p = poseAt('settled', 0, ms);
        p.shimmer.forEach((v) => expect(Math.abs(v)).toBeLessThanOrEqual(4));
        p.ripple.forEach((v) => expect(Math.abs(v)).toBeLessThanOrEqual(8));
        p.twinkle.forEach((v) => {
          expect(v).toBeGreaterThanOrEqual(0.25 - 1e-9);
          expect(v).toBeLessThanOrEqual(0.9 + 1e-9);
        });
        expect(p.haloScale).toBeGreaterThanOrEqual(1);
        expect(p.haloScale).toBeLessThanOrEqual(1.18 + 1e-9);
      }
    });
  });
});
