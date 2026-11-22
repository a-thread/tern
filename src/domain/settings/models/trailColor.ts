/** Supporter-only; others see Arctic, and the choice is kept if Supporter lapses. */
export enum TrailColor {
  Arctic = 'arctic',
  MidnightSun = 'midnightSun',
  Glacier = 'glacier',
  Twilight = 'twilight',
}

export class TrailColors {
  static readonly ALL: readonly TrailColor[] = [
    TrailColor.Arctic,
    TrailColor.MidnightSun,
    TrailColor.Glacier,
    TrailColor.Twilight,
  ];

  static readonly NAMES: Record<TrailColor, string> = {
    [TrailColor.Arctic]: 'Arctic',
    [TrailColor.MidnightSun]: 'Midnight sun',
    [TrailColor.Glacier]: 'Glacier',
    [TrailColor.Twilight]: 'Twilight',
  };
}

/** The trail drawn: the chosen one for a Supporter, Arctic for everyone else. */
export function trailFor(
  chosen: TrailColor | undefined,
  supporter: boolean,
): TrailColor {
  if (!supporter || !chosen || !TrailColors.ALL.includes(chosen)) {
    return TrailColor.Arctic;
  }
  return chosen;
}
