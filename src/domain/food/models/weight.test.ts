import { Units } from '@shared/utils/units';
import { isWeightUnit, weightNote, WeightUnit, withWeights } from './weight';

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

  it('says what a counted amount weighs in the person’s units', () => {
    // A 35 g packet of oatmeal.
    expect(weightNote(35, Units.Imperial)).toBe('= 1.2 oz');
    expect(weightNote(35, Units.Metric)).toBe('= 35 g');
  });

  it('adds nothing when the amount is typed in their own weight unit', () => {
    expect(weightNote(170, Units.Imperial, WeightUnit.Oz)).toBeNull();
    expect(weightNote(454, Units.Imperial, WeightUnit.Lb)).toBeNull();
    expect(weightNote(170, Units.Metric, null)).toBeNull();
  });

  it('converts an amount typed in another unit', () => {
    expect(weightNote(170, Units.Metric, WeightUnit.Oz)).toBe('= 170 g');
    expect(weightNote(100, Units.Imperial, null)).toBe('= 3.5 oz');
    expect(weightNote(244, Units.Imperial, 'ml')).toBe('= 8.6 oz');
  });

  it('keeps fl oz apart from oz', () => {
    expect(
      withWeights([{ label: 'fl oz', grams: 30.5 }]).map((p) => p.label),
    ).toEqual(['fl oz', 'oz', 'lb']);
  });
});
