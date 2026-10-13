import { REPLAY_AFTER_MS, shouldReplay } from './replayPolicy';

describe('shouldReplay', () => {
  const played = { at: 1_000_000, value: 6842 };

  it('plays the first time', () => {
    expect(shouldReplay(null, 0, 0)).toBe(true);
  });

  it('does not replay on a quick return with the same number', () => {
    expect(shouldReplay(played, played.at + 5_000, 6842)).toBe(false);
    expect(shouldReplay(played, played.at + REPLAY_AFTER_MS - 1, 6842)).toBe(false);
  });

  it('replays when the number changed, however quickly you return', () => {
    expect(shouldReplay(played, played.at + 1_000, 7000)).toBe(true);
  });

  it('replays after being away for a minute or more', () => {
    expect(shouldReplay(played, played.at + REPLAY_AFTER_MS, 6842)).toBe(true);
    expect(shouldReplay(played, played.at + 10 * REPLAY_AFTER_MS, 6842)).toBe(true);
  });
});
