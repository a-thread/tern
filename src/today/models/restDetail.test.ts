import { restDetail } from './restDetail';

describe('restDetail', () => {
  it('shows the steps and the streak', () => {
    expect(restDetail(2310, 9)).toBe('2,310 steps · ☀ 9 days');
  });

  it('says day for a streak of one', () => {
    expect(restDetail(500, 1)).toBe('500 steps · ☀ 1 day');
  });

  it('leaves the sun out without a streak', () => {
    expect(restDetail(0, 0)).toBe('0 steps');
  });
});
