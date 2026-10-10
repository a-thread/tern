import { mix } from './color';

describe('mix', () => {
  it('blends two colours and stays within the ends', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#000000', '#ffffff', 7)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', -3)).toBe('#000000');
  });
});
