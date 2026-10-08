import { commonFoodsSeed } from '@food/data/commonFoods.seed';
import { buildCommonIndex, searchCommonFoods } from './commonFoods';

const index = buildCommonIndex(commonFoodsSeed);
const names = (q: string) => searchCommonFoods(index, q).map((r) => r.name);

describe('searchCommonFoods', () => {
  it('puts the plain food before foods that only contain the word', () => {
    const egg = names('egg');
    expect(egg[0]).toBe('Egg');
    expect(egg.indexOf('Egg')).toBeLessThan(egg.indexOf('Egg noodles'));
  });

  it('matches word prefixes across name and detail', () => {
    expect(names('chick bre')[0]).toBe('Chicken breast');
    expect(names('rice cooked')).toContain('Rice');
  });

  it('finds foods by alias', () => {
    expect(names('oj')[0]).toBe('Orange juice');
    expect(names('pb')[0]).toBe('Peanut butter');
  });

  it('matches plurals and does not match inside words', () => {
    expect(names('eggs')[0]).toBe('Egg');
    expect(names('app')).toEqual(['Apple']);
  });

  it('returns common results tagged with their source and suggested type', () => {
    const [r] = searchCommonFoods(index, 'banana');
    expect(r).toMatchObject({ id: 'common-banana', source: 'common', tier: 1, servingLabel: '100 g' });
  });

  it('finds nothing for a blank query', () => {
    expect(searchCommonFoods(index, '  ')).toEqual([]);
  });
});
