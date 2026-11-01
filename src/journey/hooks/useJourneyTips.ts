import { useRef } from 'react';
import type { View } from 'react-native';

import { useTips } from '@shared/hooks/useTips';
import { Tip, Tips } from '@/domain/settings/models/onboarding';
import { journeyTipText } from '../models/journeyTips';

/** Lets the tern finish flying in before a tip points at the map. */
const SETTLE_MS = 2000;

/**
 * The one-time tips on Journey: the zoom button, the map/globe toggle, then tapping stops on
 * the map. `mapRefs` goes to `JourneyMap`, which holds what they point at.
 */
export function useJourneyTips({
  rootRef,
}: {
  rootRef: React.RefObject<View | null>;
}) {
  const zoom = useRef<View>(null);
  const view = useRef<View>(null);
  const map = useRef<View>(null);

  const tips = useTips({
    group: Tips.JOURNEY,
    relevant: Tips.JOURNEY,
    anchors: {
      [Tip.MapZoom]: zoom,
      [Tip.MapView]: view,
      [Tip.MapStops]: map,
    },
    rootRef,
    ready: true,
    settleMs: SETTLE_MS,
  });

  return {
    mapRefs: { zoom, view, map },
    ...tips,
    text: tips.shown ? journeyTipText(tips.shown.tip) : null,
  };
}
