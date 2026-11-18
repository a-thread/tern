/**
 * Sample steps for demo screenshots (`EXPO_PUBLIC_SAMPLE_STEPS=1`, local builds only: they'd
 * earn a signed-in account real waypoints). Written out in full so Expo can inline it.
 */
export const sampleSteps = () => process.env.EXPO_PUBLIC_SAMPLE_STEPS === '1';

/** `EXPO_PUBLIC_SAMPLE_STEP_DAYS`, to show a short history; every day when unset or invalid. */
export const sampleStepDays = (): number | undefined => {
  const n = Number(process.env.EXPO_PUBLIC_SAMPLE_STEP_DAYS);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};
