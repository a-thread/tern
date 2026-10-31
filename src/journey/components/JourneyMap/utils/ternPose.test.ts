import { Milestones } from '@/domain/waypoints/models/milestone';
import { JourneyMapShapes } from '../models/journeyMapShapes';
import { pointAt } from './routeAt';
import { ternPose } from './ternPose';

const shape = JourneyMapShapes.MAP;
const HEADING = 15;
/** Halfway along leg `i` (leg 0 runs from the colony to the first stop). */
const midLeg = (i: number) => (i + 0.5) * JourneyMapShapes.LEG_POINTS;

describe('ternPose', () => {
  it('sits on the route', () => {
    const i = midLeg(3);
    const pose = ternPose(shape, i, HEADING);
    expect(pose.x).toBeCloseTo(pointAt(shape, i).x);
    expect(pose.y).toBeCloseTo(pointAt(shape, i).y);
  });

  it('turns the icon so it faces the way the route heads, on every leg', () => {
    for (let leg = 0; leg < Milestones.STOPS.length; leg++) {
      const i = midLeg(leg);
      expect(HEADING + ternPose(shape, i, HEADING).rotate).toBeCloseTo(
        pointAt(shape, i).angle,
      );
    }
  });
});
