import { addDays, dayKey, parseDayKey } from '@shared/utils/date';
import type { StepsRepository, StepsStatus } from './steps.repository';

/**
 * Steps from Android Health Connect.
 *
 * NOT VERIFIED ON A DEVICE. It is written against the react-native-health-connect
 * API and needs a custom dev build (Expo Go can't load native modules). To turn
 * it on, see supabase/README.md ("Steps from Health Connect"). It is off unless
 * EXPO_PUBLIC_HEALTH_CONNECT=1, and returns null (steps unavailable) if the
 * package isn't installed.
 */
export function createHealthConnectStepsRepository(): StepsRepository | null {
  // Off unless asked for. Metro turns a require of a missing package into a
  // runtime error even inside try/catch, so it must never be reached without
  // the package installed.
  if (process.env.EXPO_PUBLIC_HEALTH_CONNECT !== '1') return null;

  let hc: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    hc = require('react-native-health-connect');
  } catch {
    return null;
  }
  if (typeof hc?.getSdkStatus !== 'function') return null;

  const stepsRead = { accessType: 'read', recordType: 'Steps' };

  const status = async (): Promise<StepsStatus> => {
    try {
      const sdk = await hc.getSdkStatus();
      if (sdk !== hc.SdkAvailabilityStatus.SDK_AVAILABLE) return 'unavailable';
      await hc.initialize();
      const granted: { accessType: string; recordType: string }[] =
        await hc.getGrantedPermissions();
      return granted.some(
        (p) => p.recordType === 'Steps' && p.accessType === 'read',
      )
        ? 'connected'
        : 'needs-permission';
    } catch (e) {
      console.warn('Health Connect status check failed', e);
      return 'unavailable';
    }
  };

  return {
    status,
    connect: async () => {
      try {
        await hc.initialize();
        await hc.requestPermission([stepsRead]);
      } catch (e) {
        console.warn('Health Connect permission request failed', e);
      }
      return status();
    },
    getRange: async (from, to) => {
      if ((await status()) !== 'connected') return {};
      // Aggregation (unlike raw records) de-duplicates overlapping sources.
      const rows: {
        startTime: string;
        result?: { COUNT_TOTAL?: number };
      }[] = await hc.aggregateGroupByPeriod({
        recordType: 'Steps',
        timeRangeFilter: {
          operator: 'between',
          startTime: parseDayKey(from).toISOString(),
          endTime: parseDayKey(addDays(to, 1)).toISOString(),
        },
        timeRangeSlicer: { period: 'DAYS', length: 1 },
      });
      const out: Record<string, number> = {};
      for (const r of rows) {
        out[dayKey(new Date(r.startTime))] = Number(r.result?.COUNT_TOTAL ?? 0);
      }
      return out;
    },
  };
}
