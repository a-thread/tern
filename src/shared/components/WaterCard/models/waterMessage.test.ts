import { waterMessage } from './waterMessage';

describe('waterMessage', () => {
  it('invites before the first drink', () => {
    expect(waterMessage(0, 0)).toMatch(/fresh glass/i);
  });

  it('cheers more as the goal gets closer', () => {
    expect(waterMessage(0.1, 1)).toMatch(/first sips/i);
    expect(waterMessage(0.3, 2)).toMatch(/good start/i);
    expect(waterMessage(0.6, 3)).toMatch(/halfway/i);
    expect(waterMessage(0.9, 5)).toMatch(/nearly/i);
  });

  it('celebrates the goal and never scolds past it', () => {
    expect(waterMessage(1, 6)).toMatch(/goal reached/i);
    expect(waterMessage(1.4, 8)).toMatch(/goal reached/i);
  });
});
