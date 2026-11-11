import { flockIconIndex } from './flockIcon';

describe('flockIconIndex', () => {
  it('gives a friend the same bird every time', () => {
    expect(flockIconIndex('Maya', 8)).toBe(flockIconIndex('Maya', 8));
  });

  it('stays within the silhouettes there are', () => {
    for (const name of ['You', 'Maya', 'Jo', 'Sam', '', 'Åsa']) {
      const i = flockIconIndex(name, 8);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(8);
    }
  });

  it('spreads different names across the silhouettes', () => {
    const picks = new Set(['You', 'Maya', 'Jo', 'Sam', 'Ari'].map((n) => flockIconIndex(n, 8)));
    expect(picks.size).toBeGreaterThan(1);
  });

  it('falls back to the first with none to choose from', () => {
    expect(flockIconIndex('Maya', 0)).toBe(0);
  });
});
