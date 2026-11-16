import { TrailColor, trailFor } from './trailColor';

describe('trailFor', () => {
  it("draws a Supporter's chosen trail", () => {
    expect(trailFor(TrailColor.Twilight, true)).toBe(TrailColor.Twilight);
  });

  it('draws Arctic for everyone else, keeping the choice for later', () => {
    expect(trailFor(TrailColor.Twilight, false)).toBe(TrailColor.Arctic);
  });

  it('draws Arctic for a choice it does not know', () => {
    expect(trailFor('neon' as TrailColor, true)).toBe(TrailColor.Arctic);
    expect(trailFor(undefined, true)).toBe(TrailColor.Arctic);
  });
});
