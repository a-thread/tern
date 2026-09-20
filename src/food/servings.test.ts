import {
  formatCount,
  gramsOf,
  parseGrams,
  portionGrams,
  portionServingLabel,
  scaleForGrams,
} from './servings';

describe('gramsOf', () => {
  it('reads gram-based serving labels', () => {
    expect(gramsOf('100 g')).toBe(100);
    expect(gramsOf('40g')).toBe(40);
    expect(gramsOf(' 12.5 G ')).toBe(12.5);
    expect(gramsOf('12,5 g')).toBe(12.5);
  });

  it('reads the weight at the end of a saved portion label', () => {
    expect(gramsOf('1.5 cup (237 g)')).toBe(237);
    expect(gramsOf('1 bowl (200 g)')).toBe(200);
    expect(gramsOf('1 medium (3" dia) (161 g)')).toBe(161);
    expect(gramsOf('2 slices (56,5g)')).toBe(56.5);
  });

  it('is null for anything else', () => {
    expect(gramsOf('1 bar')).toBeNull();
    expect(gramsOf('240 ml')).toBeNull();
    expect(gramsOf('0 g')).toBeNull();
    expect(gramsOf('')).toBeNull();
  });
});

describe('scaleForGrams', () => {
  it('scales nutrition from the base amount to the eaten amount', () => {
    expect(scaleForGrams({ calories: 407, protein: 11.8, carbs: 68.5, fat: 9.5 }, 100, 40)).toEqual({
      calories: 163,
      protein: 4.7,
      carbs: 27.4,
      fat: 3.8,
    });
  });

  it('is the identity at the base amount', () => {
    const per = { calories: 150, protein: 5, carbs: 27, fat: 3 };
    expect(scaleForGrams(per, 40, 40)).toEqual(per);
  });
});

describe('parseGrams', () => {
  it('accepts positive amounts, with a comma or a point', () => {
    expect(parseGrams('40')).toBe(40);
    expect(parseGrams('40,5')).toBe(40.5);
  });

  it('rejects blanks, zero, negatives and absurd amounts', () => {
    expect(parseGrams('')).toBeNull();
    expect(parseGrams('abc')).toBeNull();
    expect(parseGrams('0')).toBeNull();
    expect(parseGrams('-5')).toBeNull();
    expect(parseGrams('99999')).toBeNull();
  });
});

describe('portions', () => {
  const cup = { label: 'cup', grams: 158 };

  it('weighs a count of a portion', () => {
    expect(portionGrams(cup, 1)).toBe(158);
    expect(portionGrams(cup, 1.5)).toBe(237);
    expect(portionGrams({ label: 'slice', grams: 28.3 }, 3)).toBe(84.9);
  });

  it('formats counts without a trailing .0', () => {
    expect(formatCount(1)).toBe('1');
    expect(formatCount(1.5)).toBe('1.5');
    expect(formatCount(0.5)).toBe('0.5');
  });

  it('writes a label that gramsOf can read back', () => {
    const label = portionServingLabel(cup, 1.5);
    expect(label).toBe('1.5 cup (237 g)');
    expect(gramsOf(label)).toBe(237);
  });
});
