import { DayState } from '@shared/models/dayState';
import { dayHighlights } from './dayHighlights';

const day = (d: string, steps: number, state = DayState.Partial) => ({
  day: d,
  steps,
  state,
});

describe('dayHighlights', () => {
  it('picks the most and fewest steps', () => {
    const { strongest, quietest } = dayHighlights([
      day('2026-11-02', 6000),
      day('2026-11-03', 11884, DayState.Goal),
      day('2026-11-05', 3000),
    ]);
    expect(strongest?.day).toBe('2026-11-03');
    expect(quietest?.day).toBe('2026-11-05');
  });

  it('never calls a rest day the quietest', () => {
    const { quietest } = dayHighlights([
      day('2026-11-03', 11884, DayState.Goal),
      day('2026-11-04', 1203, DayState.Rest),
      day('2026-11-05', 5000),
    ]);
    expect(quietest?.day).toBe('2026-11-05');
  });

  it('has no quietest when the only other days are rest days', () => {
    expect(
      dayHighlights([
        day('2026-11-03', 9000, DayState.Goal),
        day('2026-11-04', 1203, DayState.Rest),
      ]).quietest,
    ).toBeNull();
  });

  it('does not name the same day both strongest and quietest', () => {
    const { strongest, quietest } = dayHighlights([day('2026-11-03', 4000)]);
    expect(strongest?.day).toBe('2026-11-03');
    expect(quietest).toBeNull();
  });

  it('skips days without steps', () => {
    expect(dayHighlights([day('2026-11-03', 0)])).toEqual({
      strongest: null,
      quietest: null,
    });
  });
});
