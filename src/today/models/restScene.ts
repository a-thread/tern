import { mix } from '@shared/utils/color';

/**
 * The rest day scene as a pure function of time: a tern on driftwood by the water at dusk.
 * `poseAt` says where everything is at a moment, so the component only draws it and the
 * motion can be tested without a screen.
 */
export class RestScenes {
  /** How long the tern takes to fly in (or out), ms. */
  static readonly FLIGHT_MS = 2400;
  /** How long the sky takes to change between day and dusk, ms. */
  static readonly SKY_MS = 2200;
  /** The driftwood the tern perches on: where its feet land. */
  static readonly PERCH = { x: 156, y: 80 };
  /** Off the edge of the scene, where it comes from and goes to. */
  static readonly FAR = { x: 300, y: 18 };
  /** How far the sun sinks toward the water at dusk. */
  static readonly SUN_DROP = 34;
  static readonly WINGBEAT_HZ = 3;
  /** Between its day and dusk looks. */
  static readonly DAY = { sky: '#7FA3BA', water: '#4F7488' };
  static readonly DUSK = { sky: '#9A7F70', water: '#5E4E44' };
}

/** What the tern is doing: resting, flying in to land, or flying off. */
export type SceneMotion = 'settled' | 'arriving' | 'leaving';

export type ScenePose = {
  skyColor: string;
  waterColor: string;
  /** 0 by day, 1 at dusk. */
  dusk: number;
  sunDrop: number;
  haloScale: number;
  haloOpacity: number;
  starOpacity: number;
  /** Twinkle of each of the four stars, 0 to 1. */
  twinkle: number[];
  /** Sideways drift of the three sun-reflection lines and the three ripples, px. */
  shimmer: number[];
  ripple: number[];
  bird: {
    x: number;
    y: number;
    /** Degrees; the pitch of the body as it climbs or dives. */
    pitch: number;
    /** -1 faces left, 1 faces right (it turns around to fly off). */
    facing: number;
    /** 0 in flight, 1 with the wing folded against the body. */
    fold: number;
    wingRotate: number;
    wingScaleX: number;
    wingScaleY: number;
    /** Idle motion: only while resting. */
    breathX: number;
    breathY: number;
    headTilt: number;
    blink: number;
    tailFlick: number;
  };
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (k: number) => Math.min(Math.max(k, 0), 1);
const smooth = (k: number) => clamp01(k) ** 2 * (3 - 2 * clamp01(k));
const cubic = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

/** A looping value that passes through `stops` ([share of the period, value]) with eased steps. */
function keyframes(clockSec: number, period: number, stops: readonly (readonly [number, number])[]) {
  const p = (clockSec / period) % 1;
  for (let i = 1; i < stops.length; i++) {
    const [p1, v1] = stops[i];
    if (p <= p1) {
      const [p0, v0] = stops[i - 1];
      return lerp(v0, v1, smooth((p - p0) / Math.max(p1 - p0, 1e-6)));
    }
  }
  return stops[stops.length - 1][1];
}

/** The wing-flap and fold at flight progress, blended into the folded wing at the perch. */
function wing(sinceSec: number, fold: number) {
  const s = Math.sin(2 * Math.PI * RestScenes.WINGBEAT_HZ * sinceSec);
  return {
    wingRotate: lerp(-15 + 10 * s, -95, fold),
    wingScaleX: lerp(1, 0.8, fold),
    wingScaleY: lerp(s * 0.95, 0.8, fold),
  };
}

const pathX = (t: number) => cubic(RestScenes.FAR.x, 230, 190, RestScenes.PERCH.x, t);
const pathY = (t: number) => cubic(RestScenes.FAR.y, 6, 52, RestScenes.PERCH.y, t);

/**
 * Where everything is. `sinceMs` is the time since this motion began, `clockMs` a running
 * clock for the idle motion (the sun's glow, the water, the tern breathing).
 */
export function poseAt(motion: SceneMotion, sinceMs: number, clockMs: number): ScenePose {
  const clock = clockMs / 1000;
  const flying = motion !== 'settled';
  const k = flying ? clamp01(sinceMs / RestScenes.FLIGHT_MS) : 1;
  const skyK = flying ? clamp01(sinceMs / RestScenes.SKY_MS) : 1;

  const dusk = motion === 'arriving' ? smooth(skyK) : motion === 'leaving' ? 1 - smooth(skyK) : 1;
  // Progress along the path, 1 at the perch: it slows as it lands, and eases into its climb.
  const t = motion === 'arriving' ? 1 - (1 - k) ** 2.2 : motion === 'leaving' ? 1 - k ** 1.8 : 1;

  // Which way it is heading, for its pitch (only in flight).
  const ahead = motion === 'leaving' ? Math.max(t - 0.02, 0) : Math.min(t + 0.02, 1);
  const heading = (Math.atan2(pathY(ahead) - pathY(t), pathX(ahead) - pathX(t)) * 180) / Math.PI;
  const level = motion === 'leaving' ? heading : heading - 180;
  const wrapped = ((((level + 180) % 360) + 360) % 360) - 180;
  const pitch = flying ? Math.min(Math.max(wrapped, -35), 35) * 0.5 : 0;

  const fold =
    motion === 'arriving'
      ? smooth((k - 0.88) / 0.12)
      : motion === 'leaving'
        ? 1 - smooth(k / 0.12)
        : 1;
  const facing = motion === 'leaving' ? lerp(-1, 1, smooth(sinceMs / 300)) : -1;

  const resting = !flying;
  const pulse = 0.5 - 0.5 * Math.cos((2 * Math.PI * clock) / 5);
  const breath = Math.sin((2 * Math.PI * clock) / 4.2);

  return {
    skyColor: mix(RestScenes.DAY.sky, RestScenes.DUSK.sky, dusk),
    waterColor: mix(RestScenes.DAY.water, RestScenes.DUSK.water, dusk),
    dusk,
    sunDrop: dusk * RestScenes.SUN_DROP,
    haloScale: 1 + 0.18 * pulse,
    haloOpacity: 0.9 - 0.35 * pulse,
    starOpacity: dusk,
    twinkle: [0, 1, 2, 3].map((i) => 0.25 + 0.65 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (clock / 4 + i * 0.33)))),
    shimmer: [0, 1, 2].map((i) => 4 * Math.sin(2 * Math.PI * (clock / 6.4 + i * 0.17))),
    ripple: [0, 1, 2].map((i) => 8 * Math.sin(2 * Math.PI * (clock / 12 + i * 0.21))),
    bird: {
      x: flying ? pathX(t) : RestScenes.PERCH.x,
      y: flying ? pathY(t) : RestScenes.PERCH.y,
      pitch,
      facing,
      fold,
      ...wing(sinceMs / 1000, flying ? fold : 1),
      breathX: resting ? 1 + 0.02 * ((breath + 1) / 2) : 1,
      breathY: resting ? 1 + 0.045 * ((breath + 1) / 2) : 1,
      headTilt: resting
        ? keyframes(clock, 11, [[0, 0], [0.62, 0], [0.68, -15], [0.78, -15], [0.84, 7], [0.88, 7], [0.94, 0], [1, 0]])
        : 0,
      blink: resting ? keyframes(clock, 5.5, [[0, 1], [0.94, 1], [0.96, 0.1], [0.98, 1], [1, 1]]) : 1,
      tailFlick: resting ? keyframes(clock, 8, [[0, 0], [0.8, 0], [0.86, -9], [0.92, 3], [1, 0]]) : 0,
    },
  };
}

/** The scene as it stands when there is nothing in motion. */
export const settledPose = () => poseAt('settled', 0, 0);
