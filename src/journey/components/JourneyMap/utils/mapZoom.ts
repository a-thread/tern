/**
 * How the map is zoomed and turned: a point `p` on the unzoomed map shows in the frame at
 * `(x, y) + scale × p turned by rotate`. Turned, the close-up runs the current leg left to right.
 */
export type MapZoom = { scale: number; x: number; y: number; rotate: number };

/** A point in the map's frame, in points. */
export type FramePoint = { x: number; y: number };

/** How far the map zooms. */
export class ZoomLimits {
  static readonly MAX = 6;
}

export const NO_ZOOM: MapZoom = { scale: 1, x: 0, y: 0, rotate: 0 };

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(Math.max(n, lo), hi);

const turn = (p: FramePoint, degrees: number): FramePoint => {
  const r = (degrees * Math.PI) / 180;
  return {
    x: p.x * Math.cos(r) - p.y * Math.sin(r),
    y: p.x * Math.sin(r) + p.y * Math.cos(r),
  };
};

/** An angle in degrees, brought into -180 to 180 so a turn always goes the short way. */
export const shortAngle = (degrees: number) =>
  ((((degrees + 180) % 360) + 360) % 360) - 180;

/** Whether `z` is the whole route: normal size, north up. */
export const isWhole = (z: MapZoom) =>
  z.scale <= 1.001 && Math.abs(shortAngle(z.rotate)) < 0.01;

/**
 * Keeps the zoom between 1 and `ZoomLimits.MAX`. North up, it also keeps the map covering the
 * whole frame (`width` by `height`), so dragging never pulls an edge into view. Turned, the
 * corners can't all be kept covered, so instead the middle of the frame is kept over the map:
 * however far it's dragged, the map never leaves the frame.
 */
export function clampZoom(z: MapZoom, width: number, height: number): MapZoom {
  const scale = clamp(z.scale, 1, ZoomLimits.MAX);
  if (Math.abs(shortAngle(z.rotate)) > 0.01) {
    const middle = { x: width / 2, y: height / 2 };
    const under = toMap({ ...z, scale }, middle);
    const kept = {
      x: clamp(under.x, 0, width),
      y: clamp(under.y, 0, height),
    };
    const at = toFrame({ ...z, scale, x: 0, y: 0 }, kept);
    return { scale, rotate: z.rotate, x: middle.x - at.x, y: middle.y - at.y };
  }
  return {
    scale,
    x: clamp(z.x, width - scale * width, 0),
    y: clamp(z.y, height - scale * height, 0),
    rotate: 0,
  };
}

/** Where a spot on the unzoomed map shows in the frame. */
export function toFrame(z: MapZoom, p: FramePoint): FramePoint {
  const t = turn(p, z.rotate);
  return { x: z.x + t.x * z.scale, y: z.y + t.y * z.scale };
}

/** The spot on the unzoomed map under `p` in the frame. */
export function toMap(z: MapZoom, p: FramePoint): FramePoint {
  return turn(
    { x: (p.x - z.x) / z.scale, y: (p.y - z.y) / z.scale },
    -z.rotate,
  );
}

/**
 * Zooms to `scale`, keeping the spot that was under `from` (when the gesture started at
 * `start`) under `to` now. With `from` and `to` the same it zooms about a point; as the fingers
 * move together it also pans. The turn stays as it was.
 */
export function zoomAbout(
  start: MapZoom,
  from: FramePoint,
  to: FramePoint,
  scale: number,
  width: number,
  height: number,
): MapZoom {
  const spot = turn(toMap(start, from), start.rotate);
  const s = clamp(scale, 1, ZoomLimits.MAX);
  return clampZoom(
    {
      scale: s,
      x: to.x - spot.x * s,
      y: to.y - spot.y * s,
      rotate: start.rotate,
    },
    width,
    height,
  );
}

/**
 * The move that takes the map from `from` to `to`, as a zoom of its own applied on top of
 * `from`: how the drawing is moved while a gesture or glide is under way, before it's redrawn.
 */
export function zoomBetween(from: MapZoom, to: MapZoom): MapZoom {
  const scale = to.scale / from.scale;
  const rotate = shortAngle(to.rotate - from.rotate);
  const t = turn({ x: from.x, y: from.y }, rotate);
  return { scale, rotate, x: to.x - scale * t.x, y: to.y - scale * t.y };
}

/** The zoom the map shows as when drawn at `from` and moved by `move`: `zoomBetween` undone. */
export function zoomThen(from: MapZoom, move: MapZoom): MapZoom {
  const at = toFrame(move, { x: from.x, y: from.y });
  return {
    scale: from.scale * move.scale,
    rotate: from.rotate + move.rotate,
    x: at.x,
    y: at.y,
  };
}
