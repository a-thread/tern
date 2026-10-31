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
  /** The recessed fill behind steppers, segmented controls and search fields. */
  track: '#E8E5DD',

  // primary action — use sparingly
  coral: '#D8431F',
  coralTint: '#F7DCD3',
  /** Errors and destructive actions (Delete, Remove). */
  danger: '#B3261E',

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
  /** Gold for points, the route and links on the dark cards. */
  sunLight: '#F2C888',

  // on the dark heroes and cards
  /** Text over a dark sky or card. */
  onDark: '#FBFAF7',
  /** A chip or label's backing over a dark sky or card. */
  chipOnDark: 'rgba(0,0,0,0.35)',
  /** The soft shadow under a hero, once the list below scrolls beneath it. */
  heroShadow: 'rgba(30,24,52,0.28)',
  /** The line flown so far on the Journey route, and the stops passed. */
  route: '#8FD9C4',
  /** The route still to fly, and the outline of stops not reached yet. */
  routeAhead: 'rgba(255,255,255,0.45)',
  /** A migration already finished, drawn faintly under the current one. */
  routePast: 'rgba(143,217,196,0.28)',
  /** Land on the Journey map. */
  mapLand: 'rgba(255,255,255,0.14)',
  /** The sea on the Journey globe, a step lighter than the hero behind it. */
  mapSea: 'rgba(255,255,255,0.05)',
  /** Lines of latitude and longitude on the Journey map. */
  mapGrid: 'rgba(255,255,255,0.06)',

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
  /** Journey, and the milestone and stop cards. */
  journey: ['#2A2440', '#4A4372', '#4E8C7D'],
  /** The waypoints and streak cards opened from Today. */
  waypoints: ['#1A2630', '#3E5A6C', '#8B7C6B'],
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

/**
 * Text styles that recur across screens. Spread one and add layout (`{ ...typography.caption,
 * marginTop: 1 }`) rather than re-declaring the font, size and colour.
 */
export const typography = {
  /** A tab's big title ("Today", "Food"). */
  screenTitle: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  /** A row's main line. */
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  /** A card or section heading. */
  heading: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  /** A big figure on a card. */
  stat: { fontFamily: font.displayMedium, fontSize: 24, color: colors.ink },
  /** A card's small title. */
  label: { fontFamily: font.semibold, fontSize: 11.5, color: colors.ink2 },
  /** The secondary line under a row's title. */
  caption: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
  /** Fine print under a figure. 11 is the smallest text size in the app. */
  small: { fontFamily: font.body, fontSize: 11, color: colors.ink2 },
  /** A chart axis, ruler tick or slider end label: the smallest size, in the quietest ink. */
  tick: { fontFamily: font.body, fontSize: 11, color: colors.ink3 },
  /** Supporting copy, a step up from a caption. */
  meta: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
} as const;
