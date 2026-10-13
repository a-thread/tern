import { cleanSpaces, sameName } from './text';

describe('names', () => {
  it('cleans spacing and compares ignoring case', () => {
    expect(cleanSpaces('  Usual   breakfast ')).toBe('Usual breakfast');
    expect(sameName('Usual breakfast', '  usual  BREAKFAST')).toBe(true);
    expect(sameName('Lunch', 'Dinner')).toBe(false);
  });
});
