/** Daily logging isn't here: "Left to do" already lists it. */
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

/** Done from what happened, never from a tap. No steps rows without a health app. */
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
