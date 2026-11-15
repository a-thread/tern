import { weekRange } from './weekRange';

// 2026-11-16 is a Monday.
const monday = '2026-11-16';

describe('weekRange', () => {
  it('goes back a week from today, and has nowhere further forward', () => {
    expect(weekRange(monday, monday, '2026-06-01')).toEqual({
      prev: '2026-11-09',
      next: null,
    });
  });

  it('comes forward a week, landing on today rather than after it', () => {
    // Last Sunday, seen on a Monday: a week on is next Sunday, so it stops at today.
    expect(weekRange('2026-11-15', monday, '2026-06-01').next).toBe(monday);
    expect(weekRange('2026-11-02', monday, '2026-06-01').next).toBe(
      '2026-11-09',
    );
  });

  it('stops at the week the history starts in', () => {
    // History starts on Wednesday 2026-06-03, whose week starts Monday 2026-06-01.
    expect(weekRange('2026-06-10', monday, '2026-06-03').prev).toBe(
      '2026-06-03',
    );
    expect(weekRange('2026-06-03', monday, '2026-06-03').prev).toBeNull();
  });

  it('without any history, stays on this week', () => {
    expect(weekRange(monday, monday).prev).toBeNull();
  });
});
