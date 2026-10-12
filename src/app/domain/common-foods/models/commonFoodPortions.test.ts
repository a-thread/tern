import { portionKind, tidyPortionLabel, typicalPortions } from './commonFoodPortions';

const labels = (ps: { label: string }[]) => ps.map((p) => p.label);

describe('tidyPortionLabel', () => {
  it('drops packaging and odd measures', () => {
    expect(tidyPortionLabel('NLEA serving', 'apple')).toBeNull();
    expect(tidyPortionLabel('single serving package', 'apple')).toBeNull();
    expect(tidyPortionLabel('linear inch', 'banana')).toBeNull();
    expect(tidyPortionLabel('pint as purchased, yields', 'strawberry')).toBeNull();
  });

  it('removes dimensions and names bare sizes and generic items after the food', () => {
    expect(tidyPortionLabel('large (8" to 8-7/8" long)', 'banana')).toBe('large banana');
    expect(tidyPortionLabel('medium', 'apple')).toBe('medium apple');
    expect(tidyPortionLabel('fruit', 'orange')).toBe('orange');
    expect(tidyPortionLabel('berry', 'blueberry')).toBe('blueberry');
    expect(tidyPortionLabel('medium or regular slice', 'bread')).toBe('medium or regular slice');
  });
});

describe('portionKind', () => {
  it('tells sizes, items, volumes and weights apart', () => {
    expect(portionKind('medium apple')).toBe('size');
    expect(portionKind('slice')).toBe('count');
    expect(portionKind('cup, sliced')).toBe('volume');
    expect(portionKind('oz')).toBe('weight');
  });
});

describe('typicalPortions', () => {
  it('offers an apple by size, medium first', () => {
    const ps = typicalPortions(
      [
        { label: 'small', grams: 165 },
        { label: 'single serving package', grams: 34 },
        { label: 'slice', grams: 25 },
        { label: 'medium', grams: 200 },
        { label: 'large', grams: 242 },
        { label: 'extra large', grams: 295 },
        { label: 'cup', grams: 125 },
      ],
      'Apple',
      'apple',
    );
    expect(labels(ps)).toEqual([
      'medium apple',
      'small apple',
      'large apple',
      'extra large apple',
      'slice',
      'cup',
    ]);
  });

  it('leads with a cup for small things, then one of them', () => {
    const ps = typicalPortions(
      [
        { label: 'berry', grams: 2 },
        { label: 'cup', grams: 148 },
      ],
      'Blueberries',
      'blueberry',
    );
    expect(labels(ps)).toEqual(['cup', 'blueberry']);
  });

  it('leads with an ounce for nuts', () => {
    const ps = typicalPortions(
      [
        { label: 'cup', grams: 141 },
        { label: 'nut', grams: 1.2 },
        { label: 'oz', grams: 28.35 },
      ],
      'Almonds',
      'almond',
    );
    expect(labels(ps)[0]).toBe('oz');
  });

  it('leads with a cup for drinks and a tablespoon for oils and spreads', () => {
    const milk = typicalPortions(
      [
        { label: 'individual school container', grams: 244 },
        { label: 'fl oz', grams: 30.5 },
        { label: 'cup', grams: 244 },
      ],
      'Milk',
      'milk',
    );
    expect(labels(milk)).toEqual(['cup', 'fl oz']);
    const oil = typicalPortions(
      [
        { label: 'cup', grams: 224 },
        { label: 'tablespoon', grams: 14 },
      ],
      'Olive oil',
      null,
    );
    expect(labels(oil)[0]).toBe('tablespoon');
  });

  it('adds ounces for cheese and meat, first for cheese and after sizes for a cut', () => {
    expect(labels(typicalPortions([{ label: 'cup, shredded', grams: 113 }], 'Cheddar cheese', null))).toEqual([
      'oz',
      'cup, shredded',
    ]);
    const breast = typicalPortions(
      [
        { label: 'medium breast', grams: 150 },
        { label: 'small breast', grams: 130 },
      ],
      'Chicken breast',
      'chicken breast',
    );
    expect(labels(breast)).toEqual(['medium breast', 'small breast', 'oz']);

    const sliced = typicalPortions(
      [
        { label: 'medium slice', grams: 60 },
        { label: 'oz, cooked', grams: 28.4 },
        { label: 'breast', grams: 130 },
      ],
      'Chicken breast',
      'chicken breast',
    );
    expect(labels(sliced)).toEqual(['breast', 'oz', 'medium slice']);
  });

  it('counts bacon by the slice, and wine by the glass', () => {
    const bacon = typicalPortions(
      [
        { label: 'cup, pieces', grams: 80 },
        { label: 'medium slice', grams: 8 },
        { label: 'thick slice', grams: 12 },
      ],
      'Bacon',
      'bacon',
    );
    expect(labels(bacon)[0]).toBe('medium slice');
    const wine = typicalPortions(
      [
        { label: 'cup', grams: 240 },
        { label: 'glass', grams: 180 },
        { label: 'bottle', grams: 750 },
      ],
      'Wine',
      'wine',
    );
    expect(labels(wine)).toEqual(['glass', 'cup', 'bottle']);
  });

  it('gives drinks a cup, and never defaults to a whole melon or a dimension', () => {
    expect(labels(typicalPortions([{ label: 'fl oz', grams: 31 }], 'Orange juice', 'orange juice'))).toEqual(['cup', 'fl oz']);
    const pineapple = typicalPortions(
      [
        { label: 'fruit', grams: 905 },
        { label: 'slice', grams: 56 },
        { label: 'cup', grams: 165 },
      ],
      'Pineapple',
      'pineapple',
    );
    expect(labels(pineapple)[0]).toBe('slice');
    expect(tidyPortionLabel('2-7/8" dia', 'orange')).toBeNull();
  });

  it('offers the whole item before its pieces, and drops the reference serving', () => {
    const avocado = typicalPortions(
      [
        { label: 'slice', grams: 15 },
        { label: 'fruit', grams: 150 },
        { label: 'serving', grams: 140 },
      ],
      'Avocado',
      'avocado',
    );
    expect(labels(avocado)).toEqual(['avocado', 'slice']);
  });

  it('reads "medium whole" as the medium food, and one grape once', () => {
    expect(tidyPortionLabel('medium whole', 'tomato')).toBe('medium tomato');
    const grapes = typicalPortions(
      [
        { label: 'grape', grams: 7 },
        { label: 'grapes', grams: 4.9 },
        { label: 'cup', grams: 150 },
      ],
      'Grapes',
      'grape',
    );
    expect(labels(grapes)).toEqual(['cup', 'grape']);
  });

  it('keeps one of each label and at most six', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ label: `cup ${i}`, grams: 100 + i }));
    expect(typicalPortions([...many, { label: 'cup 0', grams: 1 }], 'Rice', 'rice')).toHaveLength(6);
  });
});
