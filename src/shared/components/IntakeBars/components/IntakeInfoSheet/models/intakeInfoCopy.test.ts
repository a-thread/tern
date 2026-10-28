import { IntakeInfoKind, intakeInfoCopy } from './intakeInfoCopy';

describe('intakeInfoCopy', () => {
  it('explains protein as a minimum only when it is set as one', () => {
    const min = intakeInfoCopy(IntakeInfoKind.Macros, {
      proteinAsMinimum: true,
    });
    expect(min.points[0]).toMatch(/Protein is a minimum/);
    const guide = intakeInfoCopy(IntakeInfoKind.Macros, {
      proteinAsMinimum: false,
    });
    expect(guide.points[0]).toBe(
      'Protein, carbs and fat are all guides to fill toward.',
    );
  });

  it('describes the percentages without assuming a calorie target', () => {
    const copy = intakeInfoCopy(IntakeInfoKind.Macros, {
      proteinAsMinimum: true,
    });
    expect(copy.points.join(' ')).not.toMatch(/calorie target/);
  });
});
