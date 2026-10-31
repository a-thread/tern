import { JourneyMapShapes, type MapShape } from '../models/journeyMapShapes';
import { type MapZoom, NO_ZOOM, ZoomLimits } from './mapZoom';
import { pointAt, routeIndex, routePointCount } from './routeAt';

/** Where the close-up puts the leg, as shares of the frame. */
class LegFrame {
  /** The stop the leg starts from, near the left edge. */
  static readonly FROM_X = 0.1;
  /** The next stop, a little past the middle, with the way beyond it still in view. */
  static readonly TO_X = 0.7;
  /** Both, a little above the middle. */
  static readonly Y = 0.42;
}

/**
 * The close-up on the leg `progress` is on (from the stop before, or the colony, to the next
 * stop) in a `width` × `height` frame, turned so the tern flies left to right: the last stop
 * near the left edge, the next one past the middle, and the rest of the route curving away. As
 * close as that takes, up to `ZoomLimits.MAX`; on a long leg that can't get that close, the leg
 * is centred instead.
 */
export function legZoom(
  shape: MapShape,
  progress: number,
  width: number,
  height: number,
): MapZoom {
  if (!width || !height) return NO_ZOOM;
  const n = JourneyMapShapes.LEG_POINTS;
  const last = routePointCount(shape) - 1;
  const leg = Math.min(Math.floor(routeIndex(progress) / n), last / n - 1);
  // The drawing fills the frame's width, so one factor turns its units into points.
  const unit = width / JourneyMapShapes.WIDTH;
  const a = pointAt(shape, leg * n);
  const b = pointAt(shape, (leg + 1) * n);
  const [dx, dy] = [(b.x - a.x) * unit, (b.y - a.y) * unit];
  const length = Math.hypot(dx, dy) || 1;
  const rotate = -(Math.atan2(dy, dx) * 180) / Math.PI;
  const scale = Math.min(
    Math.max(((LegFrame.TO_X - LegFrame.FROM_X) * width) / length, 1),
    ZoomLimits.MAX,
  );
  // Put the leg's middle where it belongs once turned and scaled.
  const mid = { x: ((a.x + b.x) / 2) * unit, y: ((a.y + b.y) / 2) * unit };
  const r = (rotate * Math.PI) / 180;
  const turned = {
    x: mid.x * Math.cos(r) - mid.y * Math.sin(r),
    y: mid.x * Math.sin(r) + mid.y * Math.cos(r),
  };
  const centre = {
    x: ((LegFrame.FROM_X + LegFrame.TO_X) / 2) * width,
    y: LegFrame.Y * height,
  };
  return {
    scale,
    rotate,
    x: centre.x - turned.x * scale,
    y: centre.y - turned.y * scale,
  };
}
