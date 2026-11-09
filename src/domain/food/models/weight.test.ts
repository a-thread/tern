import { isWeightUnit, WeightUnit, withWeights } from './weight';

describe('weight', () => {
  it('knows its units', () => {
    expect(isWeightUnit('oz')).toBe(true);
    expect(isWeightUnit(WeightUnit.Lb)).toBe(true);
    expect(isWeightUnit('fl oz')).toBe(false);
    expect(isWeightUnit(null)).toBe(false);
  });

  it('adds oz and lb after a food’s own portions', () => {
    expect(withWeights([{ label: 'slice', grams: 30 }])).toEqual([
      { label: 'slice', grams: 30 },
      { label: 'oz', grams: 28.35 },
      { label: 'lb', grams: 453.6 },
    ]);
  });

  it('never adds an oz twice, and keeps the one it has', () => {
    const own = [{ label: 'oz', grams: 28.35 }];
    expect(withWeights(own).map((p) => p.label)).toEqual(['oz', 'lb']);
    const both = [...own, { label: 'lb', grams: 453.6 }];
    expect(withWeights(both)).toBe(both);
  });

  it('keeps fl oz apart from oz', () => {
    expect(
      withWeights([{ label: 'fl oz', grams: 30.5 }]).map((p) => p.label),
    ).toEqual(['fl oz', 'oz', 'lb']);
  });
});
