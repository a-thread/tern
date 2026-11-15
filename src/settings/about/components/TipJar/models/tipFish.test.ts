import { TipFish } from './tipFish';

describe('TipFish', () => {
  it('names each tip by rank, smallest first', () => {
    expect([0, 1, 2].map(TipFish.nameAt)).toEqual([
      'sand eel',
      'capelin',
      'herring',
    ]);
    expect([0, 1, 2].map(TipFish.sizeAt)).toEqual([16, 20, 24]);
  });

  it('makes a 4th or later tip the largest fish', () => {
    expect(TipFish.nameAt(3)).toBe('herring');
    expect(TipFish.nameAt(7)).toBe('herring');
    expect(TipFish.sizeAt(3)).toBe(24);
  });
});
