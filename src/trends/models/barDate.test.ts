import { barDate } from './barDate';

describe('barDate', () => {
  it('names a daily bar by its day and a weekly bar by its span', () => {
    expect(barDate({ day: '2026-08-02' })).toBe('Aug 2');
    expect(barDate({ week: { from: '2026-07-27', to: '2026-08-02' } })).toBe(
      'Jul 27 – Aug 2',
    );
  });

  it('has nothing to say for a bar with no date', () => {
    expect(barDate({})).toBeNull();
  });
});
