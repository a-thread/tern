import { type MapShape } from '../models/journeyMapShapes';
import { pointAt } from './routeAt';

/** Where the tern is drawn, and how far to turn it (degrees clockwise). */
export type TernPose = { x: number; y: number; rotate: number };

/**
 * The tern at a fractional point index, for an icon drawn from above heading `iconHeading`
 * degrees (clockwise from east). Seen from above it reads the same whichever way it faces, so
 * turning it is all it needs.
 */
export function ternPose(
  shape: MapShape,
  index: number,
  iconHeading: number,
): TernPose {
  const p = pointAt(shape, index);
  return { x: p.x, y: p.y, rotate: p.angle - iconHeading };
}
