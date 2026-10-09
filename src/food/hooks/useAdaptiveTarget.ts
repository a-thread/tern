import { useCallback, useEffect, useState } from 'react';

import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays, weekStartKey } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useWeight } from '@weight/WeightContext';
import { useFood } from '@food/FoodContext';
import { rescaleMacros } from '@food/models/macroSplit';
import {
  AdaptiveTarget,
  estimateBurn,
  suggestTarget,
  worthSuggesting,
  type BurnEstimate,
} from '@food/models/energyBalance';

/** The calorie targets the Targets screen allows. */
const TARGET_MIN = 1200;
const TARGET_MAX = 3500;

/**
 * The adaptive target: an estimate of what someone burns, from their own log
 * and weight trend, and once a week at most, a suggested target to match their
 * aim. Nothing changes until they choose "Use". Works only with calories and
 * weight both tracked, and only does anything once "Adapt my target" is on.
 */
export function useAdaptiveTarget() {
  const { settings, updateSettings } = useSettings();
  const { loadHistory, loadSkippedHistory, foodLog } = useFood();
  const { weightEntries } = useWeight();
  const today = useDayKey();

  const available = settings.trackCalories && settings.trackWeight;
  const on = available && settings.adaptTarget;
  const [estimate, setEstimate] = useState<BurnEstimate | null>(null);

  // Recomputed when the log or weigh-ins change (they're triggers, not inputs).
  useEffect(() => {
    if (!on) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    const from = addDays(today, -(AdaptiveTarget.WINDOW_DAYS + 1));
    const to = addDays(today, -1);
    Promise.all([loadHistory(from, to), loadSkippedHistory(from, to)])
      .then(([foodByDay, skippedByDay]) => {
        if (cancelled) return;
        setEstimate(estimateBurn({ foodByDay, skippedByDay, weighs: weightEntries, today }));
      })
      .catch((e) => console.warn('Could not work out the adaptive target', e));
    return () => {
      cancelled = true;
    };
  }, [on, today, loadHistory, loadSkippedHistory, weightEntries, foodLog.length]);

  const current = settings.calorieTarget;
  const suggestion =
    estimate?.status === 'ready' ? suggestTarget(estimate.kcal, settings.aim, current, estimate.weightLb) : null;
  const week = weekStartKey(today);
  const offer =
    on &&
    suggestion !== null &&
    worthSuggesting(suggestion, current) &&
    settings.lastSuggestionWeek !== week;

  const apply = useCallback(() => {
    if (suggestion === null) return;
    const calorieTarget = Math.min(Math.max(suggestion, TARGET_MIN), TARGET_MAX);
    updateSettings({
      calorieTarget,
      // The split stays the same; the grams follow the new target.
      macroTargets: rescaleMacros(settings.macroTargets, current, calorieTarget),
      lastSuggestionWeek: week,
    });
  }, [suggestion, settings.macroTargets, current, week, updateSettings]);

  /** "Not now": nothing more until next week. */
  const dismiss = useCallback(() => updateSettings({ lastSuggestionWeek: week }), [updateSettings, week]);

  return { available, on, estimate, suggestion, offer, apply, dismiss };
}
