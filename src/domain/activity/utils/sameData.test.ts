import { sameDays, sameSteps } from './sameData';

describe('sameSteps', () => {
  it('is true for equal contents, even as different objects', () => {
    const a = { '2026-09-19': 9000, '2026-09-20': 4000 };
    expect(sameSteps(a, { '2026-09-20': 4000, '2026-09-19': 9000 })).toBe(true);
    expect(sameSteps(a, a)).toBe(true);
    expect(sameSteps({}, {})).toBe(true);
  });

  it('is false when a value, a day or the count differs', () => {
    expect(sameSteps({ a: 1 }, { a: 2 })).toBe(false);
    expect(sameSteps({ a: 1 }, { b: 1 })).toBe(false);
    expect(sameSteps({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});

describe('sameDays', () => {
  it('ignores order', () => {
    expect(sameDays(['2026-09-19', '2026-09-20'], ['2026-09-20', '2026-09-19'])).toBe(true);
    expect(sameDays([], [])).toBe(true);
  });

  it('is false for different days or lengths', () => {
    expect(sameDays(['2026-09-19'], ['2026-09-20'])).toBe(false);
    expect(sameDays(['2026-09-19'], [])).toBe(false);
  });
});
