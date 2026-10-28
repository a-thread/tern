import { StreakFreezes } from '@/domain/activity/models/dayRecord';

/** How the streak and its freezes work, a line at a time, for the card that explains them. */
export function streakRules({ movement }: { movement: boolean }): {
  streak: string[];
  freezes: string[];
} {
  return {
    streak: [
      movement
        ? 'Each day you reach your step goal or your movement goal adds a day.'
        : 'Each day you reach your step goal adds a day.',
      'A rest day holds your streak without adding to it.',
      'Today counts once you reach the goal. A missed day ends the streak, unless a freeze covers it.',
    ],
    freezes: [
      `You earn one for every ${StreakFreezes.EVERY} goal days in a row.`,
      `You can hold up to ${StreakFreezes.MAX} at a time. Any earned while you're full aren't kept.`,
      "A missed day uses one by itself. Your streak carries on, but that day doesn't add to it.",
      'Rest days never use one.',
    ],
  };
}
