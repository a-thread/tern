import { useCallback, useEffect, useMemo } from 'react';

import { useSettings } from '../../domain/settings/SettingsContext';
import { useWaypoints } from '../../domain/waypoints/WaypointsContext';
import {
  latestMilestone,
  type Milestone,
} from '../../domain/waypoints/models/milestone';

type PendingMilestone = {
  /** A milestone reached but not yet marked, or null when there's nothing to celebrate. */
  pending: Milestone | null;
  /** Records a milestone as celebrated, so it isn't shown again. */
  markCelebrated: (milestone: Milestone) => void;
};

/** Remembered in settings, so each is celebrated once, and never one passed before Tern looked. */
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
    ready &&
    celebrated !== null &&
    milestone &&
    milestone.waypoints > celebrated
      ? milestone
      : null;

  const markCelebrated = useCallback(
    (m: Milestone) => updateSettings({ celebratedMilestone: m.waypoints }),
    [updateSettings],
  );

  return { pending, markCelebrated };
}
