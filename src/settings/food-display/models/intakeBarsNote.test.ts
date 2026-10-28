import { intakeBarsNote } from './intakeBarsNote';

const on = { trackCalories: true, trackMacros: true, showIntakeBars: true };

describe('intakeBarsNote', () => {
  it('names the zone and the protein minimum when both exist', () => {
    expect(intakeBarsNote(on)).toBe(
      'Bars never turn red or warn you. Set your calorie zone and protein minimum under Settings → Food → Calorie & macro targets.',
    );
  });

  it('names only what is tracked', () => {
    expect(intakeBarsNote({ ...on, trackMacros: false })).toMatch(
      /Set your calorie zone under/,
    );
    expect(intakeBarsNote({ ...on, trackCalories: false })).toMatch(
      /Set your protein minimum under/,
    );
  });

  it('points nowhere while the bars are off', () => {
    expect(intakeBarsNote({ ...on, showIntakeBars: false })).toBe(
      'Bars never turn red or warn you.',
    );
  });
});
