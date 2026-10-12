import { allWordsPrefix, normalizeText, wordsOf } from './foodQuery';

describe('foodQuery', () => {
  it('normalizes case, accents and punctuation', () => {
    expect(normalizeText('Crème Brûlée!')).toBe('creme brulee');
    expect(normalizeText('  Ben & Jerry’s  ')).toBe('ben jerry s');
  });

  it('makes words singular so plurals match', () => {
    expect(wordsOf('Eggs')).toEqual(['egg']);
    expect(wordsOf('Blueberries, raw')).toEqual(['blueberry', 'raw']);
    // Short words are left alone: "oats" and "oat" both stay searchable by prefix.
    expect(wordsOf('pb')).toEqual(['pb']);
  });

  it('matches every query word as a prefix of some word', () => {
    expect(allWordsPrefix(wordsOf('chick bre'), wordsOf('Chicken breast'))).toBe(true);
    expect(allWordsPrefix(wordsOf('app'), wordsOf('Pineapple'))).toBe(false);
    expect(allWordsPrefix(wordsOf('app'), wordsOf('Apple'))).toBe(true);
  });
});
