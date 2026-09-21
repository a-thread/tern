import { colors } from '@shared/theme';
import { mix, scoreColor, scoreTint, smile } from './scoreColor';

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
    expect(scoreColor('mood', 1).toLowerCase()).toBe(colors.violet.toLowerCase());
    expect(scoreColor('mood', 10).toLowerCase()).toBe(colors.sun.toLowerCase());
    expect(scoreColor('stress', 1).toLowerCase()).toBe(colors.glacier.toLowerCase());
    expect(scoreColor('stress', 10).toLowerCase()).toBe(colors.driftwood.toLowerCase());
  });

  it('gives every score a valid colour, and never the coral reserved for actions', () => {
    for (const metric of ['mood', 'stress'] as const) {
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
    expect(scoreTint('mood', 5)).toMatch(/^#[0-9a-f]{6}$/);
    expect(parseInt(scoreTint('stress', 10).slice(1, 3), 16)).toBeGreaterThan(200);
  });
});

describe('smile', () => {
  it('is a smile for good mood and for low stress, a frown for the opposite', () => {
    expect(smile('mood', 10)).toBeGreaterThan(0.9);
    expect(smile('mood', 1)).toBeLessThan(-0.9);
    expect(smile('stress', 1)).toBeGreaterThan(0.9);
    expect(smile('stress', 10)).toBeLessThan(-0.9);
  });

  it('is nearly flat in the middle', () => {
    expect(Math.abs(smile('mood', 5))).toBeLessThan(0.15);
    expect(Math.abs(smile('mood', 6))).toBeLessThan(0.15);
  });
});
