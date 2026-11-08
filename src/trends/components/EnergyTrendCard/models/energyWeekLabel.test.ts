import { energyWeekLabel } from './energyWeekLabel';

describe('energyWeekLabel', () => {
  it('names the week it ended and both figures', () => {
    expect(
      energyWeekLabel({ weekEnd: '2026-08-02', burn: 2350, intake: 2100 }),
    ).toBe(
      `Jul 27 – Aug 2 · use ${(2350).toLocaleString()} · logged ${(2100).toLocaleString()}`,
    );
  });

  it('leaves out a figure the week does not have yet', () => {
    expect(
      energyWeekLabel({ weekEnd: '2026-08-08', burn: null, intake: 1900 }),
    ).toBe(`Aug 2 – 8 · logged ${(1900).toLocaleString()}`);
    expect(
      energyWeekLabel({ weekEnd: '2026-08-08', burn: null, intake: null }),
    ).toBe('Aug 2 – 8');
  });
});
