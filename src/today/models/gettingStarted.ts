/**
 * The one-off setup left to do, on the getting-started card. Daily logging (meals, a weigh-in)
 * isn't here: "Left to do" already lists it, right underneath.
 */
export enum StartItem {
  ConnectHealth = 'connectHealth',
  StepGoal = 'stepGoal',
  Reminders = 'reminders',
}

export type StartInput = {
  healthAvailable: boolean;
  healthConnected: boolean;
  /** The step goal is set: the starting one counts, so this is true once the wizard is done. */
  stepGoalSet: boolean;
  /** A reminder was chosen, so notifications have been asked for. */
  remindersOn: boolean;
};

export type StartRow = { item: StartItem; done: boolean };

/**
 * The card's rows, each done or not from what has actually happened, never from having tapped
 * it. Steps rows are left out where the phone has no health app.
 */
export function startItems(input: StartInput): StartRow[] {
  return [
    ...(input.healthAvailable
      ? [
          { item: StartItem.ConnectHealth, done: input.healthConnected },
          { item: StartItem.StepGoal, done: input.stepGoalSet },
        ]
      : []),
    { item: StartItem.Reminders, done: input.remindersOn },
  ];
}
