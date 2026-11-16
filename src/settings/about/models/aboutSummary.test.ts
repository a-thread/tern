import { aboutSummary } from './aboutSummary';

describe('aboutSummary', () => {
  it('points to the tip jar only when there is one', () => {
    expect(aboutSummary(true)).toBe('Why Tern exists, and a tip jar');
    expect(aboutSummary(false)).toBe('Why Tern exists');
  });
});
