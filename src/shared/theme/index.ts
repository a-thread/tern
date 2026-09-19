/**
 * Tern design tokens.
 *
 * Palette rule: coral is the PRIMARY ACTION color only — the way the bill is
 * one small bright mark on a mostly-white bird. Every other domain gets its
 * own hue so the tabs read as distinct places.
 */

export const colors = {
  // neutrals
  ink: '#26262B',
  ink2: '#63636A',
  ink3: '#9C9C9E',
  paper: '#F5F3EE',
  card: '#FFFFFF',
  border: '#E7E3D9',
  dove: '#B7BCBA',
  doveTint: '#EEEFEC',

  // primary action — use sparingly
  coral: '#D8431F',
  coralTint: '#F7DCD3',

  // steps + movement
  glacier: '#5FA8B8',
  glacierTint: '#DDEEF1',
  glacierDeep: '#3A7B8A',

  // weight + trends
  water: '#3E5A6C',
  waterMid: '#6E8CA0',
  waterLight: '#A9C2CE',
  waterTint: '#E1EAED',

  // journey + milestones
  aurora: '#4E8C7D',
  auroraTint: '#DCEBE5',
  violet: '#6B5B9A',
  violetTint: '#E5E0EF',

  // streaks + goal moments
  sun: '#E0A32E',
  sunTint: '#FAEDD2',
  sunDeep: '#9C7015',

  // whole foods
  kelp: '#5C6B4E',
  kelpTint: '#E6EADF',

  // rest days
  driftwood: '#5B4636',
  driftwoodTint: '#EFE7DC',
} as const;

/** NOVA processing tiers. Information, not judgment. */
export const tierColors: Record<1 | 2 | 3 | 4, string> = {
  1: colors.kelp,
  2: colors.kelp,
  3: colors.sun,
  4: colors.coral,
};

export const gradients = {
  /** Today hero, by progress toward the step goal. */
  dawn: ['#2E4257', '#5C6F92', '#A9849E', '#E0A98C'],
  midday: ['#3E5A6C', '#6E8CA0', '#A9C2CE'],
  goalReached: ['#3E5A6C', '#8B7C6B', '#E0A96D', '#F0C888'],
  journey: ['#2A2440', '#4A4372', '#4E8C7D'],
  rest: ['#3A3327', '#5B4636', '#8A6A4F'],
} as const;

export const font = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  body: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 } as const;

export const radius = { sm: 8, md: 12, lg: 14, xl: 18, pill: 999 } as const;

/** Picks the hero gradient from step progress. */
export function skyFor(progress: number): readonly string[] {
  if (progress >= 1) return gradients.goalReached;
  if (progress >= 0.7) return gradients.dawn;
  return gradients.midday;
}
