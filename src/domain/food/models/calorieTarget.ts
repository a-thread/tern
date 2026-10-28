/** The daily calorie target's slider range, how it steps, and its quick-change chips. */
export class CalorieTarget {
  static readonly MIN = 1200;
  static readonly MAX = 3500;
  static readonly STEP = 50;
  static readonly CHIPS = [
    { label: '−20%', factor: 0.8 },
    { label: '−10%', factor: 0.9 },
    { label: '+10%', factor: 1.1 },
    { label: '+20%', factor: 1.2 },
  ] as const;

  /** Rounds to the slider's step and keeps it in range. */
  static clamp(n: number): number {
    return Math.min(
      Math.max(
        Math.round(n / CalorieTarget.STEP) * CalorieTarget.STEP,
        CalorieTarget.MIN,
      ),
      CalorieTarget.MAX,
    );
  }
}
