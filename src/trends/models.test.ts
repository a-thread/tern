import { longestProtectedRun } from './models';
import type { DayState } from '@today/models';

describe('longestProtectedRun', () => {
  it('returns 0 for an empty array', () => {
    expect(longestProtectedRun([])).toBe(0);
  });

  it('counts a run of goal days', () => {
    const days: DayState[] = ['goal', 'goal', 'goal'];
    expect(longestProtectedRun(days)).toBe(3);
  });

  it('treats rest days as protecting the streak, not breaking it', () => {
    const days: DayState[] = ['goal', 'rest', 'goal', 'goal'];
    expect(longestProtectedRun(days)).toBe(4);
  });

  it('breaks the streak on a partial or missed day', () => {
    const days: DayState[] = [
      'goal',
      'goal',
      'partial',
      'goal',
      'goal',
      'goal',
    ];
    expect(longestProtectedRun(days)).toBe(3);
  });

  it('resets on none (missed) days', () => {
    const days: DayState[] = ['goal', 'goal', 'none', 'goal'];
    expect(longestProtectedRun(days)).toBe(2);
  });
});
