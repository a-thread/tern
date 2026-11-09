import { typedServing } from './servingText';

describe('typedServing', () => {
  it('counts a serving with no number as one of it', () => {
    expect(typedServing('bowl', 340)).toEqual({
      portion: { label: 'bowl', grams: 340 },
      quantity: 1,
    });
    expect(typedServing('a large bowl', 400).portion.label).toBe('large bowl');
  });

  it('reads fractions', () => {
    expect(typedServing('1/2 cup', 120)).toEqual({
      portion: { label: 'cup', grams: 240 },
      quantity: 0.5,
    });
    expect(typedServing('½ cup', 120).quantity).toBe(0.5);
  });

  it('keeps words a product label would not use', () => {
    expect(typedServing('2 cups, chopped', 300)).toEqual({
      portion: { label: 'cup, chopped', grams: 150 },
      quantity: 2,
    });
  });

  it('is one serving when blank or only a weight', () => {
    for (const text of ['', '  ', '12 oz'])
      expect(typedServing(text, 340)).toEqual({
        portion: { label: 'serving', grams: 340 },
        quantity: 1,
      });
  });
});
