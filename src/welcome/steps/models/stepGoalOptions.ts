import { StepGoal } from '@/domain/settings/models/stepGoalHistory';

/** The usual step goals offered in the wizard. */
export class StepGoalPresets {
  static readonly ALL = [5000, 7500, 10000] as const;
}

/** The presets plus the current goal (so it shows as chosen), in order and within range. */
export function stepGoalOptions(current: number): number[] {
  const all = new Set<number>([...StepGoalPresets.ALL, current]);
  return [...all]
    .filter((n) => n >= StepGoal.MIN && n <= StepGoal.MAX)
    .sort((a, b) => a - b);
}
