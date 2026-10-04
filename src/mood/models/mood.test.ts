import { clampScore, isValidScore, scoreWord, type MoodEntry, MoodScale } from './moodEntry';
import { average, entriesBetween, entryFor, seriesOf } from './moodStats';
import { MoodMetric } from './moodEntry';

const e = (day: string, mood: number, stress: number): MoodEntry => ({ day, mood, stress });

describe('scores', () => {
  it('accepts whole numbers on the scale only', () => {
    expect(isValidScore(MoodScale.MIN)).toBe(true);
    expect(isValidScore(MoodScale.MAX)).toBe(true);
    for (const bad of [0, 11, 5.5, NaN, Infinity, -1]) expect(isValidScore(bad)).toBe(false);
  });

  it('clamps and rounds onto the scale, and treats junk as the middle', () => {
    expect(clampScore(0)).toBe(1);
    expect(clampScore(99)).toBe(10);
    expect(clampScore(4.6)).toBe(5);
    expect(clampScore(NaN)).toBe(5);
  });

  it('has a word for every score of each metric', () => {
    for (let n = MoodScale.MIN; n <= MoodScale.MAX; n++) {
      expect(scoreWord(MoodMetric.Mood, n)).toBeTruthy();
      expect(scoreWord(MoodMetric.Stress, n)).toBeTruthy();
    }
    expect(scoreWord(MoodMetric.Mood, 10)).toBe('Great');
    expect(scoreWord(MoodMetric.Stress, 1)).toBe('Calm');
  });
});

describe('entries', () => {
  const list = [e('2026-09-20', 7, 3), e('2026-09-18', 5, 6), e('2026-09-19', 6, 4)];

  it('finds a day', () => {
    expect(entryFor(list, '2026-09-19')).toEqual(e('2026-09-19', 6, 4));
    expect(entryFor(list, '2026-01-01')).toBeUndefined();
  });

  it('slices a range inclusively and sorts oldest first', () => {
    expect(entriesBetween(list, '2026-09-19', '2026-09-20').map((x) => x.day)).toEqual([
      '2026-09-19',
      '2026-09-20',
    ]);
  });

  it('charts one metric in day order', () => {
    const sorted = entriesBetween(list, '2026-09-01', '2026-09-30');
    expect(seriesOf(sorted, MoodMetric.Mood)).toEqual([5, 6, 7]);
    expect(seriesOf(sorted, MoodMetric.Stress)).toEqual([6, 4, 3]);
  });

  it('averages to one decimal, or null with nothing', () => {
    expect(average(list, MoodMetric.Mood)).toBe(6);
    expect(average([e('a', 7, 3), e('b', 8, 4), e('c', 8, 4)], MoodMetric.Mood)).toBe(7.7);
    expect(average([], MoodMetric.Stress)).toBeNull();
  });
});
