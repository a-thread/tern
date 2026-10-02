import { round1, toFiniteNumber } from './number';

describe('round1', () => {
  it('rounds to a tenth', () => {
    expect(round1(1.24)).toBe(1.2);
    expect(round1(1.25)).toBe(1.3);
    expect(round1(-0.04)).toBe(-0);
  });
});

describe('toFiniteNumber', () => {
  it('reads numbers and numeric strings', () => {
    expect(toFiniteNumber(3)).toBe(3);
    expect(toFiniteNumber('4.5')).toBe(4.5);
  });

  it('gives undefined for anything else', () => {
    expect(toFiniteNumber('abc')).toBeUndefined();
    expect(toFiniteNumber(NaN)).toBeUndefined();
    expect(toFiniteNumber(Infinity)).toBeUndefined();
    expect(toFiniteNumber(undefined)).toBeUndefined();
    expect(toFiniteNumber(null)).toBeUndefined();
  });
});
