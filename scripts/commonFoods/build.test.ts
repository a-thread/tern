import { bulkToCandidate, selectCommonFoods, type BulkFood, type Candidate } from './build';

const nutrients = (kcal: number, protein = 0, carbs = 0, fat = 0) => [
  { nutrient: { id: 1008, number: '208', unitName: 'kcal' }, amount: kcal },
  { nutrient: { id: 1003, number: '203', unitName: 'g' }, amount: protein },
  { nutrient: { id: 1005, number: '205', unitName: 'g' }, amount: carbs },
  { nutrient: { id: 1004, number: '204', unitName: 'g' }, amount: fat },
];

const bulk = (fdcId: number, description: string, extra: Partial<BulkFood> = {}): BulkFood => ({
  fdcId,
  description,
  foodNutrients: nutrients(100, 5, 10, 2),
  ...extra,
});

describe('bulkToCandidate', () => {
  it('cleans the name, keeps nutrition per 100 g and portions, and suggests a type', () => {
    const c = bulkToCandidate(
      bulk(171477, 'Chicken, broilers or fryers, breast, meat only, cooked, roasted', {
        foodCategory: { description: 'Poultry Products' },
        foodNutrients: nutrients(165, 31, 0, 3.6),
        foodPortions: [{ gramWeight: 86, amount: 0.5, modifier: 'breast, bone and skin removed', sequenceNumber: 1 }],
      }),
      'sr',
    );
    expect(c?.food).toMatchObject({
      id: 'fdc-171477',
      name: 'Chicken breast',
      detail: 'meat only, cooked, roasted',
      kcal: 165,
      protein: 31,
      tier: 1,
    });
    expect(c?.food.portions?.[0].grams).toBe(172);
  });

  it('leaves out baby food, restaurant items and branded names', () => {
    expect(bulkToCandidate(bulk(1, 'Babyfood, cereal, rice'), 'sr')).toBeNull();
    expect(bulkToCandidate(bulk(2, 'Restaurant, Chinese, fried rice'), 'sr')).toBeNull();
    expect(bulkToCandidate(bulk(3, "KELLOGG'S, Corn Flakes"), 'sr')).toBeNull();
    expect(bulkToCandidate(bulk(4, 'Apples, raw', { foodNutrients: [] }), 'sr')).toBeNull();
  });
});

describe('selectCommonFoods', () => {
  const cand = (id: number, name: string, kind: Candidate['kind'], detail?: string): Candidate => ({
    kind,
    category: '',
    food: { id: `fdc-${id}`, name, ...(detail ? { detail } : {}), kcal: 100, protein: 1, carbs: 1, fat: 1, rank: 0, tier: null },
  });

  it('keeps one food per name and detail, preferring survey foods, and ranks general foods first', () => {
    const { foods } = selectCommonFoods(
      [cand(1, 'Banana', 'sr', 'raw'), cand(2, 'Banana', 'fndds', 'raw'), cand(3, 'Banana bread', 'fndds')],
      [],
    );
    expect(foods.map((f) => f.id)).toEqual(['fdc-2', 'fdc-3']);
    expect(foods.map((f) => f.rank)).toEqual([1, 2]);
  });

  it('applies overrides, ranks them first and reports the ones that matched nothing', () => {
    const { foods, unmatched } = selectCommonFoods(
      [cand(1, 'Rice', 'fndds', 'white, cooked'), cand(2, 'Orange juice', 'fndds'), cand(3, 'Lard', 'sr')],
      [
        { name: 'Orange juice', aliases: ['oj'], rank: 1, tier: 1 },
        { name: 'Lard', exclude: true },
        { name: 'Unicorn steak', rank: 2 },
      ],
    );
    expect(foods.map((f) => f.name)).toEqual(['Orange juice', 'Rice']);
    expect(foods[0]).toMatchObject({ aliases: ['oj'], tier: 1, rank: 1 });
    expect(unmatched).toEqual(['Unicorn steak']);
  });

  it('picks one variant by its detail, gives it every size, and drops the repeats', () => {
    const sizes = [
      { label: 'large egg', grams: 50 },
      { label: 'jumbo egg', grams: 63 },
    ];
    const { foods } = selectCommonFoods(
      [
        cand(1, 'Egg', 'fndds', 'whole, raw'),
        cand(2, 'Egg', 'fndds', 'whole, cooked'),
        cand(3, 'Egg', 'fndds', 'whole, cooked, scrambled'),
      ],
      [
        { name: 'Egg', matchDetail: 'whole, raw', detail: 'whole', rank: 1, portions: sizes },
        { name: 'Egg', matchDetail: 'whole, cooked', exclude: true },
        { name: 'Egg', matchDetail: 'whole, cooked, scrambled', rename: 'Scrambled egg', detail: '' },
      ],
    );
    expect(foods.map((f) => [f.name, f.detail])).toEqual([
      ['Egg', 'whole'],
      ['Scrambled egg', undefined],
    ]);
    expect(foods[0].portions).toEqual(sizes);
  });

  it('keeps only the listed preparations of a food when asked', () => {
    const { foods } = selectCommonFoods(
      [
        cand(1, 'Egg', 'sr', 'whole, raw'),
        cand(2, 'Egg', 'sr', 'whole, cooked, fried'),
        cand(3, 'Egg', 'sr', 'whole, dried'),
        cand(4, 'Egg', 'sr', 'whole, raw, frozen, pasteurized'),
      ],
      [
        { name: 'Egg', matchDetail: 'whole, raw', detail: 'raw', rank: 1, onlyListed: true },
        { name: 'Egg', matchDetail: 'whole, cooked, fried', detail: 'fried', rank: 1.1 },
      ],
    );
    expect(foods.map((f) => f.detail)).toEqual(['raw', 'fried']);
  });

  it('caps the list', () => {
    const many = Array.from({ length: 10 }, (_, i) => cand(i, `Food ${i}`, 'fndds'));
    expect(selectCommonFoods(many, [], 4).foods).toHaveLength(4);
  });
});
