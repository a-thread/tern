import { useCallback, useEffect, useMemo } from 'react';

import { useSettings } from '@settings/SettingsContext';
import { useWaypoints } from './WaypointsContext';
import { latestMilestone, type Milestone } from './models';

type PendingMilestone = {
  /** A milestone reached but not yet marked, or null when there's nothing to celebrate. */
  pending: Milestone | null;
  /** Records a milestone as celebrated, so it isn't shown again. */
  markCelebrated: (milestone: Milestone) => void;
};

/**
 * A milestone waiting to be celebrated.
 *
 * The last celebrated stop is remembered in settings, so crossing into one is
 * marked once and only once — not again on the next launch, and not for a
 * journey that was already past it when Tern first looked (an upgrade, or the
 * preview's sample total). Like everything on the map, it follows waypoints,
 * which are earned for showing up and never for weight or calories.
 */
export function usePendingMilestone(): PendingMilestone {
  const { waypoints, ready: pointsReady } = useWaypoints();
  const { settings, ready: settingsReady, updateSettings } = useSettings();
  const ready = pointsReady && settingsReady;
  const celebrated = settings.celebratedMilestone;
  const milestone = useMemo(() => latestMilestone(waypoints), [waypoints]);

  // First look: start from where the journey already is, quietly.
  useEffect(() => {
    if (!ready || celebrated !== null) return;
    updateSettings({ celebratedMilestone: milestone?.waypoints ?? 0 });
  }, [ready, celebrated, milestone, updateSettings]);

  const pending =
    ready && celebrated !== null && milestone && milestone.waypoints > celebrated
      ? milestone
      : null;

  const markCelebrated = useCallback(
    (m: Milestone) => updateSettings({ celebratedMilestone: m.waypoints }),
    [updateSettings],
  );

  return { pending, markCelebrated };
}
