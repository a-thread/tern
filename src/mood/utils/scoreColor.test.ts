import { colors } from '@shared/theme';
import { mix, scoreColor, scoreTint, smile } from './scoreColor';
import { MoodMetric } from '@mood/models/moodEntry';

describe('mix', () => {
  it('blends two colours and stays within the ends', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#000000', '#ffffff', 7)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', -3)).toBe('#000000');
  });
});

describe('scoreColor', () => {
  it('runs each scale from its low colour to its high colour', () => {
    expect(scoreColor(MoodMetric.Mood, 1).toLowerCase()).toBe(colors.violet.toLowerCase());
    expect(scoreColor(MoodMetric.Mood, 10).toLowerCase()).toBe(colors.sun.toLowerCase());
    expect(scoreColor(MoodMetric.Stress, 1).toLowerCase()).toBe(colors.glacier.toLowerCase());
    expect(scoreColor(MoodMetric.Stress, 10).toLowerCase()).toBe(colors.driftwood.toLowerCase());
  });

  it('gives every score a valid colour, and never the coral reserved for actions', () => {
    for (const metric of [MoodMetric.Mood, MoodMetric.Stress]) {
      const seen = new Set<string>();
      for (let n = 1; n <= 10; n++) {
        const c = scoreColor(metric, n);
        expect(c).toMatch(/^#[0-9a-f]{6}$/);
        expect(c.toLowerCase()).not.toBe(colors.coral.toLowerCase());
        seen.add(c);
      }
      expect(seen.size).toBe(10);
    }
  });

  it('tints are pale', () => {
    expect(scoreTint(MoodMetric.Mood, 5)).toMatch(/^#[0-9a-f]{6}$/);
    expect(parseInt(scoreTint(MoodMetric.Stress, 10).slice(1, 3), 16)).toBeGreaterThan(200);
  });
});

describe('smile', () => {
  it('is a smile for good mood and for low stress, a frown for the opposite', () => {
    expect(smile(MoodMetric.Mood, 10)).toBeGreaterThan(0.9);
    expect(smile(MoodMetric.Mood, 1)).toBeLessThan(-0.9);
    expect(smile(MoodMetric.Stress, 1)).toBeGreaterThan(0.9);
    expect(smile(MoodMetric.Stress, 10)).toBeLessThan(-0.9);
  });

  it('is nearly flat in the middle', () => {
    expect(Math.abs(smile(MoodMetric.Mood, 5))).toBeLessThan(0.15);
    expect(Math.abs(smile(MoodMetric.Mood, 6))).toBeLessThan(0.15);
  });
});
