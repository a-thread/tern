import { StreakFreezes } from '@/domain/activity/models/dayRecord';

/** How the streak and its freezes work, a short line at a time, for the card that explains them. */
export function streakRules({ movement }: { movement: boolean }): {
  streak: string[];
  freezes: string[];
} {
  return {
    streak: [
      movement
        ? 'Hit your step goal or movement goal to add a day.'
        : 'Hit your step goal to add a day.',
      "Rest days keep your streak going, but don't add to it.",
      "Miss a day and your streak starts over, unless you have a freeze. Today isn't missed until it's over.",
    ],
    freezes: [
      `Earn one for every ${StreakFreezes.EVERY} days in a row you hit your goal.`,
      `Hold up to ${StreakFreezes.MAX} at a time.`,
      'Miss a day and one is used automatically, so your streak carries on.',
      "Rest days don't use one.",
    ],
  };
}
