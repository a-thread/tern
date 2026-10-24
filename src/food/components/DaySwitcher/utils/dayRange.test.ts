import { dayRange } from './dayRange';

// 2026-10-24 is a Saturday; that week starts Monday 2026-10-19.
const SATURDAY = '2026-10-24';
const MONDAY = '2026-10-19';

describe('dayRange', () => {
  it('goes back from today but not forward past it', () => {
    expect(dayRange(SATURDAY, SATURDAY)).toEqual({
      prev: '2026-10-23',
      next: null,
    });
  });

  it('moves both ways in the middle of the week', () => {
    expect(dayRange('2026-10-21', SATURDAY)).toEqual({
      prev: '2026-10-20',
      next: '2026-10-22',
    });
  });

  it('stops at Monday', () => {
    expect(dayRange(MONDAY, SATURDAY).prev).toBeNull();
  });

  it('still reaches yesterday on a Monday', () => {
    expect(dayRange(MONDAY, MONDAY).prev).toBe('2026-10-18');
    expect(dayRange('2026-10-18', MONDAY)).toEqual({
      prev: null,
      next: MONDAY,
    });
  });
});
