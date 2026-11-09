import {
  gramsPerMl,
  HouseholdVolume,
  knownDensity,
  withHouseholdVolumes,
  isLiquid,
  isSpooned,
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

// Sizes as the live APIs gave them (November 2026).
describe('cups and spoons', () => {
  const labels = (ps: { label: string }[]) => ps.map((p) => p.label);

  it('reads weight per cup from a cup or spoon the food really has', () => {
    // Broccoli: 1 cup, chopped = 76 g.
    expect(knownDensity([{ label: 'cup, chopped', grams: 76 }])).toBeCloseTo(
      0.321,
      3,
    );
    // Peanut butter: 1 tbsp = 16 g.
    expect(knownDensity([{ label: 'tbsp', grams: 16 }])).toBeCloseTo(1.082, 3);
    expect(knownDensity([{ label: '2 tbsp', grams: 32 }])).toBeCloseTo(1.082, 3);
  });

  it('never guesses: no cup or spoon, ml or fl oz only, or an impossible figure', () => {
    expect(knownDensity([{ label: 'packet', grams: 35 }])).toBeNull();
    expect(knownDensity([{ label: 'ml', grams: 1 }])).toBeNull();
    expect(knownDensity([{ label: 'fl oz', grams: 29.6 }])).toBeNull();
    expect(knownDensity([{ label: 'cup', grams: 5 }])).toBeNull();
    expect(knownDensity([{ label: 'cupcake', grams: 60 }])).toBeNull();
    // Puffed cereal is light, but real.
    expect(knownDensity([{ label: 'cup', grams: 14 }])).not.toBeNull();
  });

  it('adds a cup to a food with a known spoon, and spoons only to spooned foods', () => {
    const pb = withHouseholdVolumes(
      [{ label: 'tbsp', grams: 16 }],
      'Peanut butter',
    );
    // Spoons first, the cup last.
    expect(pb).toEqual([
      { label: 'tbsp', grams: 16 },
      { label: HouseholdVolume.Tsp, grams: 5.3 },
      { label: HouseholdVolume.Cup, grams: 256 },
    ]);
    const broccoli = withHouseholdVolumes(
      [
        { label: 'cup, chopped', grams: 76 },
        { label: 'serving', grams: 85 },
      ],
      'Broccoli, raw',
    );
    // It has a cup already; broccoli isn't spooned.
    expect(labels(broccoli)).toEqual(['cup, chopped', 'serving']);
    const cheddar = withHouseholdVolumes(
      [
        { label: 'slice', grams: 17 },
        { label: 'tbsp', grams: 7 },
      ],
      'Cheese, cheddar',
    );
    expect(labels(cheddar)).toEqual(['slice', 'tbsp', 'cup']);
  });

  it('keeps foods eaten by the cup or piece off the spoon', () => {
    expect(isSpooned('Olive oil')).toBe(true);
    expect(isSpooned('Sour cream')).toBe(true);
    // USDA puts the noun first.
    expect(isSpooned('Cream, sour, cultured')).toBe(true);
    expect(isSpooned('Cheese, cream')).toBe(true);
    for (const name of [
      'Ice cream, vanilla',
      'Ice creams, vanilla',
      'Cream soda',
      'Cream of Wheat',
      'Cookies, sugar',
      'Granola bar, peanut butter',
    ])
      expect(isSpooned(name)).toBe(false);
    const iceCream = withHouseholdVolumes(
      [{ label: 'cup', grams: 132 }],
      'Ice cream, vanilla',
    );
    expect(labels(iceCream)).toEqual(['cup']);
  });

  it('leaves a food with no cup or spoon alone', () => {
    const packet = [{ label: 'packet', grams: 35 }];
    expect(withHouseholdVolumes(packet, 'Oatmeal')).toBe(packet);
  });
});
