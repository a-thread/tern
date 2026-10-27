import { nextStep, wizardSteps, WizardStep } from './wizardSteps';

const all = {
  healthAvailable: true,
  trackCalories: true,
  trackMacros: true,
  showCalories: true,
  showIntakeBars: true,
  offerAccount: true,
};

describe('wizardSteps', () => {
  it('has every screen when everything applies', () => {
    expect(wizardSteps(all)).toEqual(Object.values(WizardStep));
  });

  it('leaves out what does not apply', () => {
    expect(
      wizardSteps({
        healthAvailable: false,
        trackCalories: false,
        trackMacros: false,
        showCalories: true,
        showIntakeBars: true,
        offerAccount: false,
      }),
    ).toEqual([WizardStep.Intro, WizardStep.Track, WizardStep.Reminders]);
  });

  it('offers an account just before reminders, until it is answered', () => {
    expect(wizardSteps(all).slice(-2)).toEqual([
      WizardStep.Account,
      WizardStep.Reminders,
    ]);
    expect(wizardSteps({ ...all, offerAccount: false })).not.toContain(
      WizardStep.Account,
    );
  });

  it('skips the calorie screens without calorie numbers, and the zone without bars', () => {
    expect(wizardSteps({ ...all, showCalories: false })).not.toContain(
      WizardStep.CalorieTarget,
    );
    const noBars = wizardSteps({ ...all, showIntakeBars: false });
    expect(noBars).toContain(WizardStep.CalorieTarget);
    expect(noBars).not.toContain(WizardStep.TargetZone);
  });
});

describe('nextStep', () => {
  it('goes to the next screen that applies', () => {
    expect(nextStep(WizardStep.Track, { ...all, healthAvailable: false })).toBe(
      WizardStep.FoodStyle,
    );
    expect(
      nextStep(WizardStep.FoodStyle, { ...all, showCalories: false }),
    ).toBe(WizardStep.Account);
    expect(
      nextStep(WizardStep.FoodStyle, {
        ...all,
        showCalories: false,
        offerAccount: false,
      }),
    ).toBe(WizardStep.Reminders);
  });

  it('ends after the last', () => {
    expect(nextStep(WizardStep.Reminders, all)).toBeNull();
  });
});
