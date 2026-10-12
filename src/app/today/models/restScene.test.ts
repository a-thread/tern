import { readFileSync } from 'fs';
import { join } from 'path';

import { birdBox, poseAt, RestScenes, settledPose, Sprite } from '@/today/models/restScene';

/** The size of a PNG in assets/, read from its header. */
const pngSize = (name: string) => {
  const bytes = readFileSync(join(__dirname, '../../../../assets', name));
  return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
};

const { REST, FAR, FLIGHT_MS, SKY_MS, BRAKE_THRESHOLD_K, TOUCHDOWN_K } = RestScenes;

/** The frames shown from `fromK` to `toK` of the flight, sampled every 10 ms, without repeats in a row. */
function framesBetween(motion: 'arriving' | 'leaving', fromK: number, toK: number) {
  const frames: number[] = [];
  for (let ms = FLIGHT_MS * fromK; ms <= FLIGHT_MS * toK; ms += 10) {
    const f = poseAt(motion, ms, 0).bird.frame;
    if (frames[frames.length - 1] !== f) frames.push(f);
  }
  return frames;
}

/** The scene's colours come back as lower-case hex. */
const lower = (hex: string) => hex.toLowerCase();

describe('the rest day colours', () => {
  /** WCAG relative luminance. */
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  it('has the sky burn brightest at the horizon at dusk, over water that is darker than the sky there', () => {
    const { DUSK } = RestScenes;
    expect(luminance(DUSK.skyHorizon)).toBeGreaterThan(luminance(DUSK.skyTop));
    expect(luminance(DUSK.waterTop)).toBeLessThan(luminance(DUSK.skyHorizon));
    expect(luminance(DUSK.waterBottom)).toBeLessThan(luminance(DUSK.waterTop));
  });


  it('moves the sky and water smoothly between day and dusk', () => {
    const mid = poseAt('arriving', RestScenes.SKY_MS / 2, 0);
    for (const k of ['top', 'horizon'] as const) {
      expect(mid.sky[k]).not.toBe(poseAt('arriving', 0, 0).sky[k]);
      expect(mid.sky[k]).not.toBe(poseAt('settled', 0, 0).sky[k]);
    }
  });
});

describe('the rest day scene', () => {
  it('starts settled: dusk, the tern standing on the driftwood in its resting frame', () => {
    const p = settledPose();
    expect(p.dusk).toBe(1);
    expect(p.starOpacity).toBe(1);
    expect(p.sunDrop).toBe(RestScenes.SUN_DROP);
    expect(p.bird).toMatchObject({ x: REST.x, y: REST.y, frame: Sprite.REST_FRAME, facing: -1, pitch: 0 });
    expect(p.sky).toEqual({ top: lower(RestScenes.DUSK.skyTop), horizon: lower(RestScenes.DUSK.skyHorizon) });
    expect(p.water).toEqual({ top: lower(RestScenes.DUSK.waterTop), bottom: lower(RestScenes.DUSK.waterBottom) });
  });

  describe('arriving', () => {
    it('begins with a day sky and the tern off the edge, in the air', () => {
      const p = poseAt('arriving', 0, 0);
      expect(p.dusk).toBe(0);
      expect(p.sky).toEqual({ top: lower(RestScenes.DAY.skyTop), horizon: lower(RestScenes.DAY.skyHorizon) });
      expect(p.water.top).toBe(lower(RestScenes.DAY.waterTop));
      expect(p.sunDrop).toBe(0);
      expect(p.starOpacity).toBe(0);
      expect(p.bird).toMatchObject({ x: FAR.x, y: FAR.y });
      expect(p.bird.frame).toBeLessThan(Sprite.ACTIVE_FLAP_COUNT);
    });

    it('ends standing on the driftwood in the resting frame, the sky settled', () => {
      const p = poseAt('arriving', FLIGHT_MS, 0);
      expect(p.bird.x).toBeCloseTo(REST.x);
      expect(p.bird.y).toBeCloseTo(REST.y);
      expect(p.bird.frame).toBe(Sprite.REST_FRAME);
      expect(p.bird.pitch).toBe(0);
      expect(p.dusk).toBe(1);
    });

    it('beats its wings through the nine flight frames, in order, until it brakes', () => {
      const frames = framesBetween('arriving', 0, BRAKE_THRESHOLD_K - 0.01);
      expect(new Set(frames)).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]));
      frames.slice(1).forEach((f, i) => expect(f).toBe((frames[i] + 1) % Sprite.ACTIVE_FLAP_COUNT));
    });

    it('then flares through the four braking frames, then touches down through the five landed ones', () => {
      expect(framesBetween('arriving', BRAKE_THRESHOLD_K + 0.001, TOUCHDOWN_K - 0.001)).toEqual([9, 10, 11, 12]);
      expect(framesBetween('arriving', TOUCHDOWN_K + 0.001, 1)).toEqual([13, 14, 15, 16, 17]);
    });

    it('comes in from the right and down, and is almost there by the time it brakes', () => {
      const mid = poseAt('arriving', FLIGHT_MS * 0.4, 0).bird;
      expect(mid.x).toBeLessThan(FAR.x);
      expect(mid.x).toBeGreaterThan(REST.x);
      expect(mid.y).toBeGreaterThan(FAR.y);
      expect(mid.facing).toBe(-1);
      const braking = poseAt('arriving', FLIGHT_MS * BRAKE_THRESHOLD_K, 0).bird;
      expect(Math.hypot(braking.x - REST.x, braking.y - REST.y)).toBeLessThan(25);
    });

    it('leans into the dive, nose down, but not once the sheet draws the flare', () => {
      expect(poseAt('arriving', FLIGHT_MS * 0.3, 0).bird.pitch).toBeLessThan(0);
      expect(poseAt('arriving', FLIGHT_MS * BRAKE_THRESHOLD_K, 0).bird.pitch).toBeCloseTo(0, 5);
    });

    it('moves the sky along no faster than the flight', () => {
      expect(poseAt('arriving', SKY_MS / 2, 0).dusk).toBeCloseTo(0.5, 1);
      expect(poseAt('arriving', SKY_MS, 0).dusk).toBe(1);
    });
  });

  describe('leaving', () => {
    it('starts standing on the driftwood at dusk, facing the way it came', () => {
      const p = poseAt('leaving', 0, 0);
      expect(p.bird).toMatchObject({ x: REST.x, y: REST.y, facing: -1, frame: Sprite.REST_FRAME });
      expect(p.dusk).toBe(1);
    });

    it('turns round, then plays the landing backwards before it beats its wings', () => {
      expect(poseAt('leaving', 400, 0).bird.facing).toBe(1);
      const launch = framesBetween('leaving', 0, 0.27);
      expect(launch[0]).toBe(Sprite.REST_FRAME);
      expect(launch[launch.length - 1]).toBe(Sprite.BRAKE_START);
      launch.slice(1).forEach((f, i) => expect(f).toBe(launch[i] - 1));
      const air = framesBetween('leaving', 0.3, 0.95);
      expect(Math.max(...air)).toBeLessThan(Sprite.ACTIVE_FLAP_COUNT);
    });

    it('climbs away to the right, nose up, and ends off the edge in a day sky', () => {
      const mid = poseAt('leaving', FLIGHT_MS * 0.6, 0).bird;
      expect(mid.x).toBeGreaterThan(REST.x);
      expect(mid.y).toBeLessThan(REST.y);
      expect(mid.pitch).toBeLessThan(0);
      const end = poseAt('leaving', FLIGHT_MS, 0);
      expect(end.bird.x).toBeCloseTo(FAR.x);
      expect(end.dusk).toBe(0);
    });
  });

  describe('standing', () => {
    it('keeps its feet on the driftwood in every landed frame', () => {
      for (let frame = Sprite.LANDED_START; frame < Sprite.FRAMES; frame++) {
        // The frame's lowest pixel, in the scene, with the bird placed for that frame.
        const k = TOUCHDOWN_K + ((frame - Sprite.LANDED_START + 0.5) / (Sprite.FRAMES - Sprite.LANDED_START)) * (1 - TOUCHDOWN_K);
        const bird = poseAt('arriving', FLIGHT_MS * k, 0).bird;
        expect(bird.frame).toBe(frame);
        const lowest = bird.y + (Sprite.LOWEST[frame] - Sprite.ANCHOR.y) * Sprite.SCALE;
        // Near the end of the path it is within a hair of the driftwood; the frames set it down.
        expect(lowest).toBeCloseTo(RestScenes.DRIFTWOOD.top, 0);
      }
    });

    const SETTLED = RestScenes.RUFFLE_GRACE_MS + 1; // long enough since landing to ruffle

    it('breathes, and ruffles into another frame now and then', () => {
      const breaths = [0, 1000, 2000, 3000].map((ms) => poseAt('settled', SETTLED, ms).bird.breath);
      expect(Math.max(...breaths)).toBeGreaterThan(Math.min(...breaths));
      breaths.forEach((b) => {
        expect(b).toBeGreaterThanOrEqual(1);
        expect(b).toBeLessThanOrEqual(1.02 + 1e-9);
      });
      expect(poseAt('settled', SETTLED, 3000).bird.frame).toBe(Sprite.REST_FRAME);
      expect(poseAt('settled', SETTLED, 11_500).bird.frame).toBe(Sprite.RUFFLE_FRAME);
      expect(poseAt('settled', SETTLED, 12_100).bird.frame).toBe(Sprite.REST_FRAME);
    });

    it('simply stands, never ruffling, for the first moments after landing', () => {
      for (let clockMs = 0; clockMs < 12_000; clockMs += 50) {
        expect(poseAt('settled', 0, clockMs).bird.frame).toBe(Sprite.REST_FRAME);
        expect(poseAt('settled', RestScenes.RUFFLE_GRACE_MS, clockMs).bird.frame).toBe(Sprite.REST_FRAME);
      }
    });

    it('keeps breathing through the flight, so nothing jumps when it lands or takes off', () => {
      for (const clockMs of [0, 700, 1400, 2100, 2800, 3500]) {
        const landing = poseAt('arriving', FLIGHT_MS, clockMs).bird.breath;
        const standing = poseAt('settled', 0, clockMs).bird.breath;
        const leaving = poseAt('leaving', 0, clockMs).bird.breath;
        expect(landing).toBeCloseTo(standing, 10);
        expect(leaving).toBeCloseTo(standing, 10);
      }
    });

    it('sets the ruffle frame on the ground too, wherever the log has bobbed to', () => {
      for (const ms of [11_500, 11_700, 11_900]) {
        const { bird, driftwood } = poseAt('settled', SETTLED, ms);
        expect(bird.frame).toBe(Sprite.RUFFLE_FRAME);
        const lowest = bird.y + (Sprite.LOWEST[bird.frame] - Sprite.ANCHOR.y) * Sprite.SCALE;
        expect(lowest).toBeCloseTo(RestScenes.DRIFTWOOD.top + driftwood.dy, 5);
      }
    });
  });

  describe('the driftwood', () => {
    const { LOG } = RestScenes;
    const at = (motion: 'settled' | 'arriving' | 'leaving', k: number, clockMs = 0) =>
      poseAt(motion, FLIGHT_MS * k, clockMs);

    it('floats in from off the left edge ahead of the tern, and is in place before it brakes', () => {
      expect(at('arriving', 0).driftwood.dx).toBe(LOG.OFFSCREEN);
      expect(at('arriving', LOG.ARRIVED_K).driftwood.dx).toBeCloseTo(0, 5);
      expect(LOG.ARRIVED_K).toBeLessThan(BRAKE_THRESHOLD_K);
      const xs = [0, 0.15, 0.3, 0.45, 0.6].map((k) => at('arriving', k).driftwood.dx);
      xs.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(xs[i])); // steadily rightward
      expect(at('arriving', 1).driftwood.dx).toBe(0);
    });

    it('decelerates as it arrives', () => {
      const step = (a: number, b: number) => at('arriving', b).driftwood.dx - at('arriving', a).driftwood.dx;
      expect(step(0, 0.1)).toBeGreaterThan(step(0.5, 0.6));
    });

    it('stays put while the tern takes off, then floats away to the left', () => {
      expect(at('leaving', 0).driftwood.dx).toBe(0);
      expect(at('leaving', LOG.DEPART_K).driftwood.dx).toBe(0);
      expect(at('leaving', 0.7).driftwood.dx).toBeLessThan(0);
      expect(at('leaving', 1).driftwood.dx).toBe(LOG.OFFSCREEN);
    });

    it('bobs gently on the water, rocking a little, while it rests', () => {
      const dys: number[] = [];
      const tilts: number[] = [];
      for (let ms = 0; ms < LOG.BOB_S * 1000; ms += 100) {
        const { driftwood } = poseAt('settled', 0, ms);
        dys.push(driftwood.dy);
        tilts.push(driftwood.tilt);
        expect(driftwood.dx).toBe(0);
      }
      expect(Math.max(...dys)).toBeCloseTo(LOG.BOB, 1);
      expect(Math.min(...dys)).toBeCloseTo(-LOG.BOB, 1);
      expect(Math.max(...tilts.map(Math.abs))).toBeLessThanOrEqual(LOG.TILT + 1e-9);
    });

    it('rocks harder while the current carries it, and settles as it arrives', () => {
      const carried = Math.max(...[0, 1, 2, 3, 4, 5, 6].map((i) => Math.abs(poseAt('arriving', 100, i * 160).driftwood.tilt)));
      const settled = Math.max(...[0, 1, 2, 3, 4, 5, 6].map((i) => Math.abs(poseAt('settled', 0, i * 160).driftwood.tilt)));
      expect(carried).toBeGreaterThan(settled);
    });

    it('carries the tern up and down with it once it has landed', () => {
      for (const ms of [0, 900, 1800, 2700]) {
        const { bird, driftwood } = poseAt('settled', 0, ms);
        expect(bird.y).toBeCloseTo(RestScenes.REST.y + driftwood.dy, 5);
      }
      // And it is not carried while it is still in the air.
      const flying = poseAt('arriving', FLIGHT_MS * 0.3, 900);
      expect(flying.bird.y).not.toBeCloseTo(RestScenes.REST.y + flying.driftwood.dy, 1);
      // Landing at the end of the flight, it is on the log wherever the log is.
      const landed = poseAt('arriving', FLIGHT_MS, 900);
      expect(landed.bird.y).toBeCloseTo(RestScenes.REST.y + landed.driftwood.dy, 5);
    });
  });

  describe('idle scenery', () => {
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

describe('the stars', () => {
  const stars = (ms: number, motion: 'arriving' | 'leaving' = 'arriving') => poseAt(motion, ms, 0).starOpacity;

  it('wait for the dark: none while the sky is still more day than dusk', () => {
    for (let ms = 0; ms <= RestScenes.SKY_MS; ms += 50) {
      const p = poseAt('arriving', ms, 0);
      if (p.dusk <= RestScenes.STARS_FROM) expect(p.starOpacity).toBe(0);
    }
    expect(stars(RestScenes.SKY_MS * 0.3)).toBe(0);
  });

  it('then come out gradually, and are all out by dusk', () => {
    const out = [0.4, 0.55, 0.7, 0.85, 1].map((k) => stars(RestScenes.SKY_MS * k));
    out.slice(1).forEach((o, i) => expect(o).toBeGreaterThanOrEqual(out[i]));
    expect(out[out.length - 1]).toBe(1);
    expect(out[0]).toBeLessThan(0.5);
  });

  it('go in again as the day comes back', () => {
    expect(stars(0, 'leaving')).toBe(1);
    expect(stars(RestScenes.SKY_MS, 'leaving')).toBe(0);
    expect(stars(RestScenes.SKY_MS * 0.3, 'leaving')).toBeGreaterThan(stars(RestScenes.SKY_MS * 0.6, 'leaving'));
  });
});

describe('the sun', () => {
  const { HORIZON, SUN_DAY_Y, SUN_RADIUS } = RestScenes;
  const centre = (motion: 'settled' | 'arriving' | 'leaving', ms = 0) => SUN_DAY_Y + poseAt(motion, ms, 0).sunDrop;

  it('is clear of the water by day', () => {
    expect(centre('arriving', 0) + SUN_RADIUS).toBeLessThan(HORIZON);
  });

  it('has half set by dusk: its centre on the horizon, so the water covers its lower half', () => {
    expect(centre('settled')).toBeCloseTo(HORIZON, -1);
    expect(Math.abs(centre('settled') - HORIZON)).toBeLessThanOrEqual(SUN_RADIUS / 2);
    expect(centre('settled') - SUN_RADIUS).toBeLessThan(HORIZON); // still some above it
  });

  it('sinks steadily on the way to dusk, and rises again when the rest day is undone', () => {
    const down = [0, 0.25, 0.5, 0.75, 1].map((k) => centre('arriving', RestScenes.SKY_MS * k));
    down.slice(1).forEach((y, i) => expect(y).toBeGreaterThanOrEqual(down[i]));
    const up = [0, 0.25, 0.5, 0.75, 1].map((k) => centre('leaving', RestScenes.SKY_MS * k));
    up.slice(1).forEach((y, i) => expect(y).toBeLessThanOrEqual(up[i]));
    expect(up[up.length - 1]).toBeCloseTo(SUN_DAY_Y);
  });
});

describe('the sheet', () => {
  it('ships at 1x, 2x and 3x so it stays sharp on any screen, every frame in the same place', () => {
    const base = pngSize('tern-landing.png');
    expect(base).toEqual({ w: 2416, h: 130 });
    expect(pngSize('tern-landing@2x.png')).toEqual({ w: base.w * 2, h: base.h * 2 });
    expect(pngSize('tern-landing@3x.png')).toEqual({ w: base.w * 3, h: base.h * 3 });
    // The 1x sheet is the one the cell sizes in `Sprite` describe.
    expect(base.w / Sprite.FRAMES).toBeCloseTo(Sprite.CELL.w);
    expect(base.h).toBe(Sprite.CELL.h);
  });

  it('has the eighteen frames the animation steps through', () => {
    expect(Sprite.FRAMES).toBe(18);
    expect(Sprite.LOWEST).toHaveLength(Sprite.FRAMES);
    expect(Sprite.CELL.w * Sprite.FRAMES).toBeCloseTo(2416);
    expect(Sprite.ACTIVE_FLAP_COUNT + Sprite.BRAKE_COUNT + (Sprite.FRAMES - Sprite.LANDED_START)).toBe(Sprite.FRAMES);
    expect(Sprite.BRAKE_START).toBe(Sprite.ACTIVE_FLAP_COUNT);
    expect(Sprite.LANDED_START).toBe(Sprite.BRAKE_START + Sprite.BRAKE_COUNT);
    expect(Sprite.REST_FRAME).toBe(Sprite.FRAMES - 1);
  });
});

describe('birdBox', () => {
  /** Where the feet end up on screen, by turning the cell the way a view's transform does. */
  const feetOnScreen = (bird: ReturnType<typeof settledPose>['bird'], unit: number) => {
    const box = birdBox(bird, unit);
    const k = Sprite.SCALE * unit;
    // Flip, then breath, then tilt, all about the centre of the cell.
    const x = (Sprite.ANCHOR.x - Sprite.CELL.w / 2) * k * bird.facing;
    const y = (Sprite.ANCHOR.y - Sprite.CELL.h / 2) * k * bird.breath;
    const a = (bird.pitch * Math.PI) / 180;
    return {
      x: box.left + box.width / 2 + x * Math.cos(a) - y * Math.sin(a),
      y: box.top + box.height / 2 + x * Math.sin(a) + y * Math.cos(a),
    };
  };

  it('sizes the cell from the sheet and the scale', () => {
    const box = birdBox(settledPose().bird, 2);
    expect(box.width).toBeCloseTo(Sprite.CELL.w * Sprite.SCALE * 2);
    expect(box.height).toBeCloseTo(Sprite.CELL.h * Sprite.SCALE * 2);
  });

  it('puts the feet on the bird however it is flipped, tilted and breathing', () => {
    const birds = [
      settledPose().bird,
      poseAt('settled', 0, 3000).bird,
      poseAt('arriving', 700, 0).bird,
      poseAt('arriving', 1500, 0).bird,
      poseAt('leaving', 150, 0).bird, // part-way through turning round
      poseAt('leaving', 1500, 0).bird,
    ];
    for (const unit of [1, 1.27, 2.5]) {
      for (const bird of birds) {
        const feet = feetOnScreen(bird, unit);
        expect(feet.x).toBeCloseTo(bird.x * unit, 3);
        expect(feet.y).toBeCloseTo(bird.y * unit, 3);
      }
    }
  });

  it('stands the resting tern over the driftwood, head toward the sun, at any width', () => {
    for (const unit of [1, 1.27, 2.5]) {
      const bird = settledPose().bird;
      const box = birdBox(bird, unit);
      const k = Sprite.SCALE * unit;
      // Facing left, a point at sheet x lies at box.left + (cell width - x) * k.
      const atSheetX = (x: number) => (box.left + (Sprite.CELL.w - x) * k) / unit;
      const head = atSheetX(120);
      const tail = atSheetX(11);
      expect(head).toBeLessThan(tail);
      expect(head).toBeGreaterThan(RestScenes.DRIFTWOOD.x - 31); // the driftwood is 62 wide
      expect(tail).toBeLessThan(RestScenes.DRIFTWOOD.x + 31);
    }
  });
});
