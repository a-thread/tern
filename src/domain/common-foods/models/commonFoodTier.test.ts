import { suggestTier } from './commonFoodTier';

describe('suggestTier', () => {
  it('suggests whole for plain fruit, meat, eggs and grains', () => {
    expect(suggestTier('Apples', 'raw, with skin', 'Fruits and Fruit Juices')).toBe(1);
    expect(suggestTier('Chicken breast', 'meat only, roasted', 'Poultry Products')).toBe(1);
    expect(suggestTier('Egg', 'whole, raw')).toBe(1);
    expect(suggestTier('Rice', 'white, cooked', 'Cereal Grains and Pasta')).toBe(1);
  });

  it('suggests culinary ingredient for oils, butter, sugar and honey', () => {
    expect(suggestTier('Olive oil')).toBe(2);
    expect(suggestTier('Butter', 'salted', 'Dairy and Egg Products')).toBe(2);
    expect(suggestTier('Honey')).toBe(2);
  });

  it('suggests processed for bread, cheese and canned foods', () => {
    expect(suggestTier('Bread', 'whole wheat', 'Baked Products')).toBe(3);
    expect(suggestTier('Cheddar cheese')).toBe(3);
    expect(suggestTier('Black beans', 'canned, drained', 'Legume and Legume Products')).toBe(3);
  });

  it('leaves anything doubtful unset, and never suggests ultra-processed', () => {
    expect(suggestTier('Chicken breast', 'breaded, fried', 'Poultry Products')).toBeNull();
    expect(suggestTier('Cookies', 'chocolate chip')).toBeNull();
    expect(suggestTier('Pizza', 'cheese')).toBeNull();
    expect(suggestTier('Chicken', 'NFS')).toBeNull();
  });
});
