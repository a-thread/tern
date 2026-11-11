import { flockColors } from '@shared/theme';

/**
 * How each friend looks in a ternary's flock: one of eight tern poses from design's Arctic
 * Tern Flying Logo set, each baked in its colour from `flockColors` (built by
 * scripts/buildFlockIcons.ts, in this order). A friend's look is their place in the ternary
 * (`flockWithLooks`), so the map and the Flying today list always agree on who's who.
 */
export class FlockLooks {
  static readonly SOURCES = [
    require('../../../assets/flock/flock-banking-turn.png'),
    require('../../../assets/flock/flock-curving-flight.png'),
    require('../../../assets/flock/flock-downstroke.png'),
    require('../../../assets/flock/flock-level-glide.png'),
    require('../../../assets/flock/flock-rising-arc.png'),
    require('../../../assets/flock/flock-sharp-sweep.png'),
    require('../../../assets/flock/flock-streamlined-flight.png'),
    require('../../../assets/flock/flock-upward-sweep.png'),
  ];

  /** The tern image for a look. */
  static source(look: number) {
    return FlockLooks.SOURCES[look % FlockLooks.SOURCES.length];
  }

  /** The colour for a look, the same as its bird's. */
  static color(look: number): string {
    return flockColors[look % flockColors.length];
  }
}
