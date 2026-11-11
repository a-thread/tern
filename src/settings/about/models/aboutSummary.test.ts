import { aboutSummary } from './aboutSummary';

describe('aboutSummary', () => {
  it('thanks a Supporter on the Settings row', () => {
    expect(aboutSummary(true)).toBe('What Tern is for · thank you for supporting it');
    expect(aboutSummary(false)).toBe('What Tern is for, and supporting it');
  });
});
