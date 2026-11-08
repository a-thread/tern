/**
 * Sample steps in place of the phone's health app, for demo screenshots on a local build:
 * every past day gets a stable, plausible count and today is part-way through. On when
 * `EXPO_PUBLIC_SAMPLE_STEPS=1` in a local `.env`, and never in an EAS build (a test keeps it
 * out of `eas.json`), since sample steps earn whatever account is signed in real waypoints.
 * Written out in full so Expo can inline it.
 */
export const sampleSteps = () => process.env.EXPO_PUBLIC_SAMPLE_STEPS === '1';

/**
 * How many days of sample steps there are, ending today (`EXPO_PUBLIC_SAMPLE_STEP_DAYS`), to
 * show the app with a short history, like a new install's. Every day when unset or not a
 * positive whole number.
 */
export const sampleStepDays = (): number | undefined => {
  const n = Number(process.env.EXPO_PUBLIC_SAMPLE_STEP_DAYS);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};
