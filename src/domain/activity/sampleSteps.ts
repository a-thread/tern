/**
 * Sample steps in place of the phone's health app, for demo screenshots on a local build:
 * every past day gets a stable, plausible count and today is part-way through. On when
 * `EXPO_PUBLIC_SAMPLE_STEPS=1` in a local `.env`, and never in an EAS build (a test keeps it
 * out of `eas.json`), since sample steps earn whatever account is signed in real waypoints.
 * Written out in full so Expo can inline it.
 */
export const sampleSteps = () => process.env.EXPO_PUBLIC_SAMPLE_STEPS === '1';
