import {
  gramsPerMl,
  isLiquid,
  isVolumeAmount,
  VolumeUnit,
  withVolumes,
} from './volume';
import { withWeights } from './weight';

describe('volume', () => {
  it('knows a drink by its name, its units or its source', () => {
    expect(isLiquid('Milk', [])).toBe(true);
    expect(isLiquid('Orange juice', [])).toBe(true);
    expect(isLiquid('Apple', [])).toBe(false);
    expect(isLiquid('Milk chocolate', [])).toBe(false);
    expect(isLiquid('Water chestnuts', [])).toBe(false);
    expect(isLiquid('Oat drink powder', [])).toBe(false);
    expect(isLiquid('Syrup', [{ label: 'fl oz', grams: 39 }])).toBe(true);
    expect(isLiquid('Oatly Barista', [], true)).toBe(true);
  });

  it('reads a serving or package written as a volume', () => {
    expect(isVolumeAmount('330 ml')).toBe(true);
    expect(isVolumeAmount('1 l')).toBe(true);
    expect(isVolumeAmount('12 fl oz (355 ml)')).toBe(true);
    expect(isVolumeAmount('30 g')).toBe(false);
    expect(isVolumeAmount('1 bar')).toBe(false);
    expect(isVolumeAmount(undefined)).toBe(false);
  });

  it('works out how dense a drink is from a household volume', () => {
    expect(gramsPerMl([{ label: 'cup', grams: 244 }])).toBeCloseTo(1.031, 3);
    expect(gramsPerMl([{ label: '2 tbsp', grams: 30 }])).toBeCloseTo(1.014, 3);
    // Nothing to go on, or nonsense: water.
    expect(gramsPerMl([{ label: 'can', grams: 355 }])).toBe(1);
    expect(gramsPerMl([{ label: 'cup', grams: 20 }])).toBe(1);
  });

  it('adds fl oz and ml after a drink’s own portions', () => {
    expect(withVolumes([{ label: 'cup', grams: 244 }], 'Milk')).toEqual([
      { label: 'cup', grams: 244 },
      { label: VolumeUnit.FlOz, grams: 30.5 },
      { label: VolumeUnit.Ml, grams: 1.031 },
    ]);
    // Only what it doesn't already have.
    expect(
      withVolumes([{ label: 'fl oz', grams: 31 }], 'Milk').map((p) => p.label),
    ).toEqual(['fl oz', 'ml']);
  });

  it('leaves anything else alone', () => {
    const portions = [{ label: 'medium apple', grams: 182 }];
    expect(withVolumes(portions, 'Apple')).toBe(portions);
  });

  it('leaves room for oz and lb after fl oz and ml, without clashing', () => {
    const all = withWeights(withVolumes([{ label: 'cup', grams: 244 }], 'Milk'));
    expect(all.map((p) => p.label)).toEqual(['cup', 'fl oz', 'ml', 'oz', 'lb']);
  });
});
