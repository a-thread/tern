import { useMemo } from 'react';

import {
  formatVolume,
  formatWeight,
  fromDisplayVolume,
  fromDisplayWeight,
  quickWaterOz,
  stepWaterGoal,
  toDisplayVolume,
  toDisplayWeight,
  volumeUnitLabel,
  weightUnitLabel,
} from '@shared/utils/units';
import { useSettings } from './SettingsContext';

/** Weight helpers bound to the user's unit setting. Stored weight is always pounds. */
export function useUnits() {
  const { settings } = useSettings();
  const units = settings.units;
  return useMemo(
    () => ({
      units,
      weightLabel: weightUnitLabel(units),
      /** stored lb → number in the user's unit */
      toDisplay: (lb: number) => toDisplayWeight(lb, units),
      /** number in the user's unit → stored lb */
      fromDisplay: (value: number) => fromDisplayWeight(value, units),
      /** stored lb → "172.4 lb" / "78.2 kg" */
      formatWeight: (lb: number, digits?: number) =>
        formatWeight(lb, units, digits),
      /** A goal, without a trailing ".0": "163 lb", "74.5 kg" */
      formatGoal: (lb: number) =>
        `${Number(toDisplayWeight(lb, units).toFixed(1))} ${weightUnitLabel(units)}`,
      /** Water: stored ounces are shown as oz or oz. */
      volumeLabel: volumeUnitLabel(units),
      toDisplayVolume: (oz: number) => toDisplayVolume(oz, units),
      fromDisplayVolume: (value: number) => fromDisplayVolume(value, units),
      formatVolume: (oz: number) => formatVolume(oz, units),
      quickWaterOz: quickWaterOz(units),
      /** The goal one step up (1) or down (-1), in stored ounces. */
      stepWaterGoal: (oz: number, direction: 1 | -1) => stepWaterGoal(oz, direction, units),
    }),
    [units],
  );
}
