import { mix } from '@shared/utils/color';

/**
 * The tern's landing sheet (assets/tern-landing.png): 18 frames side by side, 2416 x 130, the
 * bird facing right. Frames 0-8 are the wingbeat in the air, 9-12 the flare as it brakes, and
 * 13-17 touchdown and standing still. It was drawn from one fixed camera, so the frames are
 * placed by their cell, not by the bird: the bird moves inside its cell as it lands.
 */
export class Sprite {
  static readonly FRAMES = 18;
  static readonly CELL = { w: 2416 / 18, h: 130 };

  static readonly ACTIVE_FLAP_COUNT = 9;
  static readonly BRAKE_START = 9;
  static readonly BRAKE_COUNT = 4;
  static readonly LANDED_START = 13;
  static readonly REST_FRAME = 17;
  static readonly RUFFLE_FRAME = 15;

  /** The feet in the resting frame, in sprite pixels: the point the bird is placed by. */
  static readonly ANCHOR = { x: 83, y: 87 };
  /** The lowest pixel of each frame. The standing frames are shifted so their feet share the ground. */
  static readonly LOWEST = [116, 112, 100, 108, 105, 91, 87, 88, 86, 100, 96, 103, 92, 83, 85, 100, 91, 87];

  /** Scene units per sprite pixel: how big the bird is in the scene. */
  static readonly SCALE = 0.32;
}

export class RestScenes {
  /** How long the tern takes to fly in (or out), ms. */
  static readonly FLIGHT_MS = 2400;
  /** How long the sky takes to change between day and dusk, ms. */
  static readonly SKY_MS = 2200;
  /** When, as a share of the flight, it stops flapping and flares to land, and when its feet touch. */
  static readonly BRAKE_THRESHOLD_K = 0.65;
  static readonly TOUCHDOWN_K = 0.87;
  /** Going out: when its feet leave the driftwood, as a share of the flight. */
  static readonly LIFT_OFF_K = 0.14;
  /** Wingbeats a second in the air (the nine flight frames are one beat). */
  static readonly FLAP_HZ = 2.2;

  /** The driftwood: where its centre is, and the height of its top, which the tern stands on. */
  static readonly DRIFTWOOD = { x: 155, top: 79 };
  /** Where its feet are when resting: on the top of the driftwood, at its middle. */
  static readonly REST = { x: 155, y: 79 };
  /**
   * The driftwood floats in from the left edge, ahead of the tern, and back out when it goes.
   * `OFFSCREEN` is how far left of its place it starts (and ends); it has arrived `ARRIVED_K`
   * of the way through the flight in, and starts to leave `DEPART_K` of the way through the
   * flight out (after the tern has gone). On the water it bobs `BOB` units every `BOB_S`
   * seconds and rocks `TILT` degrees.
   */
  static readonly LOG = { OFFSCREEN: -200, ARRIVED_K: 0.6, DEPART_K: 0.45, BOB: 0.6, BOB_S: 3.6, TILT: 0.9 };
  /** Off the edge of the scene, where it comes from and goes to. */
  static readonly FAR = { x: 310, y: 14 };
  /** Where sky meets water. */
  static readonly HORIZON = 82;
  /**
   * The sun: its centre's height by day, and how far it sinks by dusk, which leaves it half
   * below the horizon (the water is drawn over its lower half).
   */
  static readonly SUN_DAY_Y = 44;
  static readonly SUN_DROP = 38;
  static readonly SUN_RADIUS = 12;
  /** How dark it has to be, as a share of the change to dusk, before the first stars appear. */
  static readonly STARS_FROM = 0.5;
  /** After landing, how long it simply stands before it can ruffle, ms. */
  static readonly RUFFLE_GRACE_MS = 3000;
  /**
   * The sky runs from `skyTop` down to a glow at the horizon, the water from `waterTop` at the
   * horizon down to `waterBottom`. By day it is a pale blue sky over blue water; at dusk a deep
   * blue-teal sky burns gold at the horizon over dark teal water.
   */
  static readonly DAY = { skyTop: '#6F9DB8', skyHorizon: '#B5D3E0', waterTop: '#5C8EA6', waterBottom: '#3E6B83' };
  static readonly DUSK = { skyTop: '#2F4B5E', skyHorizon: '#F0B77F', waterTop: '#3E6272', waterBottom: '#20384A' };
  /** The sun's disc and its glow, and the colour of its shimmer on the water. */
  static readonly SUN = { disc: '#FBE8C8', glow: '#EFA25E' };
}

/** What the tern is doing: resting, flying in to land, or taking off. */
export type SceneMotion = 'settled' | 'arriving' | 'leaving';

export type ScenePose = {
  /** The sky's gradient, top to horizon, and the water's, horizon to bottom. */
  sky: { top: string; horizon: string };
  water: { top: string; bottom: string };
  dusk: number;
  sunDrop: number;
  haloScale: number;
  haloOpacity: number;
  starOpacity: number;
  twinkle: number[];
  shimmer: number[];
  ripple: number[];
  /** The driftwood's offset from its place (scene units), and its rock in degrees. */
  driftwood: { dx: number; dy: number; tilt: number };
  bird: {
    /** Where the feet are (the sprite's anchor), in scene units. */
    x: number;
    y: number;
    /** Degrees; a slight lean into the climb or the dive, gone by the time it lands. */
    pitch: number;
    /** -1 faces left, 1 faces right (it turns around to fly off). */
    facing: number;
    /** Which of the 18 frames. */
    frame: number;
    /** A slow rise and fall of the chest, as a vertical scale between 1 and 1.02, in every motion. */
    breath: number;
  };
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (k: number) => Math.min(Math.max(k, 0), 1);
const smooth = (k: number) => clamp01(k) ** 2 * (3 - 2 * clamp01(k));
const cubic = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const pathX = (t: number) => cubic(RestScenes.FAR.x, 240, 190, RestScenes.REST.x, t);
const pathY = (t: number) => cubic(RestScenes.FAR.y, -6, 24, RestScenes.REST.y, t);

/** The frame in the air: the nine-frame wingbeat, looping. */
const flapFrame = (sinceMs: number) =>
  Math.floor((Math.max(sinceMs, 0) / 1000) * RestScenes.FLAP_HZ * Sprite.ACTIVE_FLAP_COUNT) %
  Sprite.ACTIVE_FLAP_COUNT;

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
  // Progress along the path, 1 at the driftwood. Coming in, it slows to a stop exactly as its
  // feet touch (the landed frames then play on the spot); going out, it stays down through the
  // first of the launch frames, then eases into its climb.
  const t =
    motion === 'arriving'
      ? 1 - (1 - clamp01(k / RestScenes.TOUCHDOWN_K)) ** 2.2
      : motion === 'leaving'
        ? 1 - clamp01((k - RestScenes.LIFT_OFF_K) / (1 - RestScenes.LIFT_OFF_K)) ** 1.8
        : 1;

  // The lean follows the way it is heading, but the sheet already draws the flare and the
  // touchdown, so the lean fades out before it brakes and builds back only once it is climbing.
  const ahead = motion === 'leaving' ? Math.max(t - 0.02, 0) : Math.min(t + 0.02, 1);
  const heading = (Math.atan2(pathY(ahead) - pathY(t), pathX(ahead) - pathX(t)) * 180) / Math.PI;
  const level = motion === 'leaving' ? heading : heading - 180;
  const wrapped = ((((level + 180) % 360) + 360) % 360) - 180;
  const lean =
    motion === 'arriving'
      ? 1 - smooth((k - 0.35) / (RestScenes.BRAKE_THRESHOLD_K - 0.35))
      : motion === 'leaving'
        ? smooth((k - 0.3) / 0.3)
        : 0;
  // (`+ 0` so a lean of nothing is 0, not -0.)
  const pitch = Math.min(Math.max(wrapped, -35), 35) * 0.4 * lean + 0;
  const facing = motion === 'leaving' ? lerp(-1, 1, smooth(sinceMs / 300)) : -1;

  let frame: number;
  if (motion === 'arriving') {
    if (k < RestScenes.BRAKE_THRESHOLD_K) {
      frame = flapFrame(sinceMs);
    } else if (k < RestScenes.TOUCHDOWN_K) {
      const p = (k - RestScenes.BRAKE_THRESHOLD_K) / (RestScenes.TOUCHDOWN_K - RestScenes.BRAKE_THRESHOLD_K);
      frame = Sprite.BRAKE_START + Math.min(Math.floor(p * Sprite.BRAKE_COUNT), Sprite.BRAKE_COUNT - 1);
    } else {
      const landed = Sprite.FRAMES - Sprite.LANDED_START;
      const p = (k - RestScenes.TOUCHDOWN_K) / (1 - RestScenes.TOUCHDOWN_K);
      frame = Sprite.LANDED_START + Math.min(Math.floor(p * landed), landed - 1);
    }
  } else if (motion === 'leaving') {
    // The landing in reverse: stand, crouch, flare, then the wingbeat.
    const launch = 0.28;
    if (k < launch) {
      const steps = Sprite.REST_FRAME - Sprite.BRAKE_START;
      frame = Sprite.REST_FRAME - Math.min(Math.floor((k / launch) * (steps + 1)), steps);
    } else {
      frame = flapFrame(sinceMs - launch * RestScenes.FLIGHT_MS);
    }
  } else {
    // Every so often it ruffles, for a moment (never right after it has landed, when it should
    // simply be standing).
    const ruffling = sinceMs > RestScenes.RUFFLE_GRACE_MS && clock % 12 > 11.2;
    frame = ruffling ? Sprite.RUFFLE_FRAME : Sprite.REST_FRAME;
  }

  // The standing frames don't all end on the same pixel row: set each down on the ground.
  const grounded = frame >= Sprite.LANDED_START ? (Sprite.ANCHOR.y - Sprite.LOWEST[frame]) * Sprite.SCALE : 0;

  // The driftwood: floating in ahead of the tern (and out after it), bobbing on the water, and
  // rocking harder while the current is carrying it. The tern rides it once it has landed.
  const log = RestScenes.LOG;
  const bobPhase = (2 * Math.PI * clock) / log.BOB_S;
  const bob = log.BOB * Math.sin(bobPhase);
  const away =
    motion === 'arriving'
      ? (1 - clamp01(k / log.ARRIVED_K)) ** 3
      : motion === 'leaving'
        ? clamp01((k - log.DEPART_K) / (1 - log.DEPART_K)) ** 2
        : 0;
  const driftwood = {
    dx: log.OFFSCREEN * away + 0, // (`+ 0`: in place is 0, not -0)
    dy: bob,
    tilt: log.TILT * Math.sin(bobPhase + 1.1) + 1.5 * away * Math.sin((2 * Math.PI * clock) / 1.1),
  };
  const ride =
    motion === 'arriving'
      ? smooth((k - RestScenes.BRAKE_THRESHOLD_K) / (RestScenes.TOUCHDOWN_K - RestScenes.BRAKE_THRESHOLD_K))
      : motion === 'leaving'
        ? 1 - smooth((k - RestScenes.LIFT_OFF_K) / 0.16)
        : 1;

  const pulse = 0.5 - 0.5 * Math.cos((2 * Math.PI * clock) / 5);
  const breath = Math.sin((2 * Math.PI * clock) / 4.2);

  return {
    sky: {
      top: mix(RestScenes.DAY.skyTop, RestScenes.DUSK.skyTop, dusk),
      horizon: mix(RestScenes.DAY.skyHorizon, RestScenes.DUSK.skyHorizon, dusk),
    },
    water: {
      top: mix(RestScenes.DAY.waterTop, RestScenes.DUSK.waterTop, dusk),
      bottom: mix(RestScenes.DAY.waterBottom, RestScenes.DUSK.waterBottom, dusk),
    },
    dusk,
    sunDrop: dusk * RestScenes.SUN_DROP,
    haloScale: 1 + 0.18 * pulse,
    haloOpacity: 0.9 - 0.35 * pulse,
    // Stars wait for the dark: they come out in the second half of the change to dusk.
    starOpacity: smooth((dusk - RestScenes.STARS_FROM) / (1 - RestScenes.STARS_FROM)),
    twinkle: [0, 1, 2, 3].map((i) => 0.25 + 0.65 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (clock / 4 + i * 0.33)))),
    shimmer: [0, 1, 2].map((i) => 4 * Math.sin(2 * Math.PI * (clock / 6.4 + i * 0.17))),
    ripple: [0, 1, 2].map((i) => 8 * Math.sin(2 * Math.PI * (clock / 12 + i * 0.21))),
    driftwood,
    bird: {
      x: flying ? pathX(t) : RestScenes.REST.x,
      y: (flying ? pathY(t) : RestScenes.REST.y) + grounded + bob * ride,
      pitch,
      facing,
      frame,
      // Always, so it never jumps when the tern lands or takes off.
      breath: 1 + 0.02 * ((breath + 1) / 2),
    },
  };
}

/** The scene as it stands when there is nothing in motion. */
export const settledPose = () => poseAt('settled', 0, 0);

/**
 * Where to put the sprite cell on screen so the feet land exactly on the bird's (x, y), when the
 * cell is turned about its own centre (the way a plain view is): flipped to face left or right,
 * squeezed by the breath, then tilted. `unit` is screen pixels per scene unit. The result is the
 * cell's size and its top-left corner.
 */
export function birdBox(bird: ScenePose['bird'], unit: number) {
  const k = Sprite.SCALE * unit; // screen pixels per sprite pixel
  const width = Sprite.CELL.w * k;
  const height = Sprite.CELL.h * k;
  // The feet, measured from the cell's centre, carried through the flip and breath, then the tilt.
  const dx = (Sprite.ANCHOR.x - Sprite.CELL.w / 2) * k * bird.facing;
  const dy = (Sprite.ANCHOR.y - Sprite.CELL.h / 2) * k * bird.breath;
  const a = (bird.pitch * Math.PI) / 180;
  const anchorX = dx * Math.cos(a) - dy * Math.sin(a);
  const anchorY = dx * Math.sin(a) + dy * Math.cos(a);
  return {
    width,
    height,
    left: bird.x * unit - anchorX - width / 2,
    top: bird.y * unit - anchorY - height / 2,
  };
}
