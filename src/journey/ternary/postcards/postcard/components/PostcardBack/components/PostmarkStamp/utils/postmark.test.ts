import { postmarkLines } from './postmark';

describe('postmarkLines', () => {
  it('prints a stop in capitals, without a leading The', () => {
    expect(postmarkLines('The North Atlantic stopover')).toEqual([
      'NORTH',
      'ATLANTIC',
      'STOPOVER',
    ]);
  });

  it('keeps short words together on a line', () => {
    expect(postmarkLines('Cape Verde')).toEqual(['CAPE VERDE']);
    expect(postmarkLines('Iceland')).toEqual(['ICELAND']);
  });

  it('never runs past three lines', () => {
    expect(
      postmarkLines('One two three four five six seven eight nine'),
    ).toHaveLength(3);
  });
});
