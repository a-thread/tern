import { Platform } from 'react-native';
import { addDays, dayKey, parseDayKey } from '@shared/utils/date';
import { healthEnabled } from '../health/healthEnabled';
import { StepsRepository } from './steps.repository';
import { StepsStatus } from './models/stepsStatus';

/**
 * Steps from Android Health Connect; needs a dev build and EXPO_PUBLIC_HEALTH=1
 * (docs/health-connect.md). Null off Android or without the package.
 */
export function createHealthConnectStepsRepository(): StepsRepository | null {
  // Metro fails on a missing package's require even inside try/catch, so never reach it unasked.
  if (Platform.OS !== 'android' || !healthEnabled()) return null;

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
      if (sdk !== hc.SdkAvailabilityStatus.SDK_AVAILABLE)
        return StepsStatus.Unavailable;
      await hc.initialize();
      const granted: { accessType: string; recordType: string }[] =
        await hc.getGrantedPermissions();
      return granted.some(
        (p) => p.recordType === 'Steps' && p.accessType === 'read',
      )
        ? StepsStatus.Connected
        : StepsStatus.NeedsPermission;
    } catch (e) {
      console.warn('Health Connect status check failed', e);
      return StepsStatus.Unavailable;
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
      if ((await status()) !== StepsStatus.Connected) return {};
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
