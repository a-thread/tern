import type { SearchResult } from '@food/data/sources/searchResult';
import { dedupeFoods, matchesQuery, rankFoods, scoreResult, stableMerge, type RankedFood } from './foodRanking';

const food = (name: string, extra: Partial<SearchResult> = {}): SearchResult => ({
  id: extra.id ?? name,
  name,
  servingLabel: '100 g',
  calories: 100,
  protein: 5,
  carbs: 10,
  fat: 2,
  tier: null,
  ...extra,
});

describe('scoreResult', () => {
  it('ranks exact, then name prefix, then word, then detail matches', () => {
    const exact = scoreResult('greek yogurt', food('Greek yogurt'), 'usda');
    const prefix = scoreResult('greek yog', food('Greek yogurt, plain'), 'usda');
    const words = scoreResult('yogurt greek', food('Greek yogurt with honey'), 'usda');
    const detail = scoreResult('plain', food('Greek yogurt', { detail: 'plain' }), 'usda');
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(words);
    expect(words).toBeGreaterThan(detail);
  });

  it('prefers shorter, more general names', () => {
    expect(scoreResult('rice', food('Rice'), 'usda')).toBeGreaterThan(
      scoreResult('rice', food('Rice pudding with raisins and cinnamon'), 'usda'),
    );
  });

  it('lifts a packaged food when the query names its brand', () => {
    const branded = food('Original bar', { brand: 'Clif' });
    expect(scoreResult('clif bar', branded, 'off')).toBeGreaterThan(
      scoreResult('clif bar', food('Bar', { brand: 'Store' }), 'off'),
    );
  });

  it('sinks packaged rows with missing macros', () => {
    const complete = food('Oat bar', { brand: 'X' });
    const empty = food('Oat bar', { brand: 'X', protein: 0, carbs: 0, fat: 0 });
    expect(scoreResult('oat bar', complete, 'off')).toBeGreaterThan(scoreResult('oat bar', empty, 'off'));
  });
});

describe('matchesQuery', () => {
  it('matches word prefixes, not text inside words', () => {
    expect(matchesQuery(food('Pineapple'), 'app')).toBe(false);
    expect(matchesQuery(food('Apple pie'), 'app pie')).toBe(true);
    expect(matchesQuery(food('Bar', { brand: 'Clif' }), 'clif')).toBe(true);
  });
});

describe('dedupeFoods', () => {
  it('drops repeats of the same food with near-identical calories', () => {
    const list = [food('Oats', { id: 'a', calories: 379 }), food('oats', { id: 'b', calories: 381 }), food('Oats', { id: 'c', calories: 150 })];
    expect(dedupeFoods(list).map((r) => r.id)).toEqual(['a', 'c']);
  });
});

describe('rankFoods', () => {
  it('puts your own food first when it matches as well', () => {
    const ranked = rankFoods('oats', [
      { from: 'common', foods: [food('Oats', { id: 'common-oats', calories: 379 })] },
      { from: 'mine', foods: [food('Oats', { id: 'logged-oats', calories: 380 })] },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(['logged-oats']);
    expect(ranked[0].from).toBe('mine');
  });
});

describe('stableMerge', () => {
  const ranked = (id: string, score: number): RankedFood => ({ ...food(id), from: 'off', score });

  it('keeps rows already shown in place when ordinary results arrive late', () => {
    const merged = stableMerge(['a', 'b'], [ranked('c', 650), ranked('a', 600), ranked('b', 500)]);
    expect(merged.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('lets a much better late result rise to the top', () => {
    const merged = stableMerge(['a', 'b'], [ranked('exact', 1100), ranked('a', 600), ranked('b', 500)]);
    expect(merged.map((r) => r.id)).toEqual(['exact', 'a', 'b']);
  });

  it('drops rows that no longer match', () => {
    const merged = stableMerge(['gone', 'a'], [ranked('a', 600)]);
    expect(merged.map((r) => r.id)).toEqual(['a']);
  });
});
