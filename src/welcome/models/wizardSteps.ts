/** The setup wizard's screens, in order. Each is also its route name in `WelcomeStack`. */
export enum WizardStep {
  Intro = 'Intro',
  Track = 'Track',
  Steps = 'Steps',
  FoodStyle = 'FoodStyle',
  CalorieTarget = 'CalorieTarget',
  TargetZone = 'TargetZone',
  MacroTargets = 'MacroTargets',
  Account = 'Account',
  Reminders = 'Reminders',
}

export type WizardInput = {
  /** A health app is on this phone to read steps from. */
  healthAvailable: boolean;
  trackFood: boolean;
  trackWeight: boolean;
  trackCalories: boolean;
  trackMacros: boolean;
  showCalories: boolean;
  showIntakeBars: boolean;
  /** Accounts exist in this build, nobody is signed in, and the invitation hasn't been answered. */
  offerAccount: boolean;
};

/**
 * The screens that apply, from what has been chosen so far: no Steps screen without a health
 * app, no food screens without food, no calorie target without calorie numbers, no zone
 * without intake bars, no macro split without macros, no account invitation once answered or signed in, and no reminders
 * without food or weight to remind about. Worked out again
 * after each step, since each step can change it.
 */
export function wizardSteps(input: WizardInput): WizardStep[] {
  const food = input.trackFood;
  const calories = food && input.trackCalories && input.showCalories;
  return [
    WizardStep.Intro,
    WizardStep.Track,
    ...(input.healthAvailable ? [WizardStep.Steps] : []),
    ...(food ? [WizardStep.FoodStyle] : []),
    ...(calories ? [WizardStep.CalorieTarget] : []),
    ...(calories && input.showIntakeBars ? [WizardStep.TargetZone] : []),
    ...(food && input.trackMacros ? [WizardStep.MacroTargets] : []),
    ...(input.offerAccount ? [WizardStep.Account] : []),
    ...(food || input.trackWeight ? [WizardStep.Reminders] : []),
  ];
}

/** The screen after `current`, or null after the last. */
export function nextStep(
  current: WizardStep,
  input: WizardInput,
): WizardStep | null {
  const order = Object.values(WizardStep);
  const applicable = wizardSteps(input);
  const at = order.indexOf(current);
  return applicable.find((step) => order.indexOf(step) > at) ?? null;
}
