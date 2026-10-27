export enum IntakeInfoKind {
  Calories = 'calories',
  Macros = 'macros',
}

export type IntakeInfoCopy = {
  title: string;
  lead: string;
  points: string[];
  action?: string;
};

/**
 * What the explainer for a slide says. The macros one follows how protein is set up: a minimum
 * with a mark it fills past, or a guide like carbs and fat.
 */
export function intakeInfoCopy(
  kind: IntakeInfoKind,
  { proteinAsMinimum }: { proteinAsMinimum: boolean },
): IntakeInfoCopy {
  if (kind === IntakeInfoKind.Calories)
    return {
      title: 'About your target zone',
      lead: 'A range to land in over the day, not a line to stay under.',
      points: [
        'The zone starts around your calorie target, about 15% either side. You can set your own under Calorie & macro targets.',
        'Being below or above it is just information. Tern never warns you and it never affects your streak or waypoints.',
      ],
      action: 'Change the zone',
    };
  return {
    title: 'About your macro targets',
    lead: 'Targets are a reference point, not a limit.',
    points: [
      proteinAsMinimum
        ? 'Protein is a minimum to reach, so its bar has a mark at your target and keeps filling past it. Carbs and fat are guides to fill toward.'
        : 'Protein, carbs and fat are all guides to fill toward.',
      "The percentages are your split: each macro's share of the energy in your targets. Change the split, or pick a preset, under Settings, then Calorie & macro targets.",
    ],
  };
}
