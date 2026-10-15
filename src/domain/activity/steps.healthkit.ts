import { addDays, dayKey, parseDayKey } from '@shared/utils/date';
import { loadHealthKit, type HealthKitApi } from '../health/healthkit';
import { StepsRepository } from './steps.repository';
import { StepsStatus } from './models/stepsStatus';

/**
 * Steps from Apple Health on iPhone. Needs a custom dev build (Expo Go can't load HealthKit);
 * see docs/healthkit.md.
 *
 * HealthKit never says whether *read* access was denied, so this can only tell "the permission
 * sheet hasn't been shown" (needs permission) from "it has" (connected). A denial reads as zero
 * steps, which the Health data screen explains.
 */
export function createHealthKitStepsRepository(
  health: HealthKitApi | null = loadHealthKit(),
): StepsRepository | null {
  if (!health) return null;

  const status = async (): Promise<StepsStatus> => {
    try {
      if (!(await health.isAvailable())) return StepsStatus.Unavailable;
      return (await health.needsAuthorization()) ? StepsStatus.NeedsPermission : StepsStatus.Connected;
    } catch (e) {
      console.warn('Apple Health status check failed', e);
      return StepsStatus.Unavailable;
    }
  };

  return {
    status,
    connect: async () => {
      try {
        if (await health.isAvailable()) await health.requestAuthorization();
      } catch (e) {
        console.warn('Apple Health permission request failed', e);
      }
      return status();
    },
    getRange: async (from, to) => {
      if ((await status()) !== StepsStatus.Connected) return {};
      // The statistics query de-duplicates iPhone and Apple Watch samples, as the Health app does.
      const rows = await health.dailySteps(parseDayKey(from), parseDayKey(addDays(to, 1)));
      const out: Record<string, number> = {};
      for (const r of rows) out[dayKey(r.day)] = Math.round(r.steps);
      return out;
    },
  };
}
