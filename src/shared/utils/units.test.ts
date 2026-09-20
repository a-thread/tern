import {
  formatWeight,
  fromDisplayWeight,
  kgToLb,
  lbToKg,
  toDisplayWeight,
} from './units';

describe('units', () => {
  it('converts between kg and lb', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 2);
    expect(lbToKg(220.462)).toBeCloseTo(100, 2);
  });

  it('leaves pounds alone in imperial', () => {
    expect(toDisplayWeight(172.4, 'imperial')).toBe(172.4);
    expect(fromDisplayWeight(172.4, 'imperial')).toBe(172.4);
  });

  it('round-trips a kilogram value through lb storage', () => {
    for (const kg of [54, 68.3, 78.2, 90.1]) {
      const lb = fromDisplayWeight(kg, 'metric');
      expect(toDisplayWeight(lb, 'metric')).toBeCloseTo(kg, 1);
    }
  });

  it('formats stored pounds in the chosen unit', () => {
    expect(formatWeight(172.4, 'imperial')).toBe('172.4 lb');
    expect(formatWeight(172.4, 'metric')).toBe('78.2 kg');
  });
});
