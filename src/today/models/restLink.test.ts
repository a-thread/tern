import { showsRestLink } from './restLink';

const open = {
  todayReached: false,
  todayIsRest: false,
  restLeft: 2,
};

describe('showsRestLink', () => {
  it('offers a rest day while one is left', () => {
    expect(showsRestLink(open)).toBe(true);
    expect(showsRestLink({ ...open, restLeft: 0 })).toBe(false);
  });

  it('offers to undo today’s rest day even with none left', () => {
    expect(showsRestLink({ ...open, restLeft: 0, todayIsRest: true })).toBe(
      true,
    );
  });

  it('offers no new rest day once the goal is reached', () => {
    expect(showsRestLink({ ...open, todayReached: true })).toBe(false);
  });

  it('still offers to undo a rest day on which the goal was reached', () => {
    expect(
      showsRestLink({ ...open, todayReached: true, todayIsRest: true }),
    ).toBe(true);
  });
});
