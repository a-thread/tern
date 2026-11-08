/** The ranges the Trends screens offer. */
export enum TrendRange {
  Week = 'Week',
  Month = 'Month',
  SixMonths = '6 months',
}

/** What each Trends range means, in one place: its length, how it reads in a sentence, how it is drawn. */
export class TrendRanges {
  static readonly ALL: readonly TrendRange[] = [
    TrendRange.Week,
    TrendRange.Month,
    TrendRange.SixMonths,
  ];

  /** How many days each range covers. */
  static readonly DAYS: Readonly<Record<TrendRange, number>> = {
    Week: 7,
    Month: 30,
    '6 months': 180,
  };

  /**
   * How the range ends a sentence: "daily average in the last 7 days". Each range is the days
   * up to today, not a calendar week or month, so it never says "this week" or "this month".
   */
  static readonly LABEL: Readonly<Record<TrendRange, string>> = {
    Week: 'in the last 7 days',
    Month: 'in the last 30 days',
    '6 months': 'in the last 6 months',
  };

  /** Half a year is drawn as this many weekly bars (more, and they get too thin to read). */
  static readonly WEEKLY_BARS = 25;
}
