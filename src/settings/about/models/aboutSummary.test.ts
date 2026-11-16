import { aboutSummary } from './aboutSummary';

describe('aboutSummary', () => {
  it('points to why Tern exists and the tip jar', () => {
    expect(aboutSummary()).toBe('Why Tern exists, and a tip jar');
  });
});
