import { cleanPortionLabel, plainness, portionOrder, splitUsdaName } from './commonFoodName';

describe('splitUsdaName', () => {
  it('pulls the cut into the name and drops data-set noise', () => {
    expect(
      splitUsdaName('Chicken, broilers or fryers, breast, meat only, cooked, roasted'),
    ).toEqual({ name: 'Chicken breast', detail: 'meat only, cooked, roasted' });
  });

  it('keeps a plain food as its first segment', () => {
    expect(splitUsdaName('Apples, raw, with skin')).toEqual({
      name: 'Apples',
      detail: 'raw, with skin',
    });
  });

  it('keeps a multi-word head and sentence-cases it', () => {
    expect(splitUsdaName('Rice, white, long-grain, regular, cooked')).toEqual({
      name: 'Rice',
      detail: 'white, long-grain, regular, cooked',
    });
    expect(splitUsdaName('Yogurt, greek, plain')).toEqual({ name: 'Greek yogurt', detail: 'plain' });
    expect(splitUsdaName('Greek yogurt, plain, nonfat')).toEqual({
      name: 'Greek yogurt',
      detail: 'plain, nonfat',
    });
  });

  it('treats white as part of an egg, not of rice', () => {
    expect(splitUsdaName('Egg, white, raw, fresh')).toEqual({ name: 'Egg white', detail: 'raw, fresh' });
  });

  it('ignores commas inside brackets', () => {
    expect(splitUsdaName('Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked')).toEqual({
      name: 'Chickpeas',
      detail: 'mature seeds, cooked',
    });
  });

  it('keeps hot and iced as preparation, not a kind', () => {
    expect(splitUsdaName('Tea, hot, leaf, black')).toEqual({ name: 'Tea', detail: 'hot, leaf, black' });
  });

  it('handles a name with no detail', () => {
    expect(splitUsdaName('Hummus')).toEqual({ name: 'Hummus' });
  });

  it('turns juice into part of the name', () => {
    expect(splitUsdaName('Orange, juice, raw')).toEqual({
      name: 'Orange juice',
      detail: 'raw',
    });
  });

  it('names the kind under a general head, and puts ground first', () => {
    expect(splitUsdaName('Fish, salmon, raw')).toEqual({ name: 'Salmon', detail: 'raw' });
    expect(splitUsdaName('Cheese, cheddar')).toEqual({ name: 'Cheddar cheese' });
    expect(splitUsdaName('Cheese, nfs')).toEqual({ name: 'Cheese' });
    expect(splitUsdaName('Fish, raw')).toEqual({ name: 'Fish', detail: 'raw' });
    expect(splitUsdaName('Beef, ground, raw')).toEqual({ name: 'Ground beef', detail: 'raw' });
  });
});

describe('plainness', () => {
  it('rates the plain form of a food below its variants', () => {
    expect(plainness('whole, raw')).toBeLessThan(plainness('creamed'));
    expect(plainness('raw')).toBeLessThan(plainness('sockeye, canned, total can contents'));
    expect(plainness('')).toBeLessThan(plainness('honey roasted'));
    expect(plainness('baked')).toBeLessThan(plainness('roll, oven-roasted'));
  });
});

describe('portions', () => {
  it('cleans dataset noise from labels', () => {
    expect(cleanPortionLabel('fl oz (no ice)')).toBe('fl oz');
    expect(cleanPortionLabel('apple, any size')).toBe('apple');
    expect(cleanPortionLabel('piece, NFS')).toBe('piece');
    expect(cleanPortionLabel('RACC')).toBe('serving');
    expect(cleanPortionLabel('Peeled')).toBe('peeled');
  });

  it('puts household portions before ounce measures', () => {
    expect(portionOrder(['fl oz', 'cup', 'oz', 'medium banana'])).toEqual([1, 3, 0, 2]);
  });
});
