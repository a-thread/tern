/** Which way someone wants their weight to go, for the adaptive target. */
export enum Aim {
  Lose = 'lose',
  LoseSlowly = 'loseSlowly',
  Maintain = 'maintain',
  Gain = 'gain',
}

export const AIM_LABEL: Record<Aim, string> = {
  [Aim.Lose]: 'Lose',
  [Aim.LoseSlowly]: 'Lose slowly',
  [Aim.Maintain]: 'Maintain',
  [Aim.Gain]: 'Gain',
};
