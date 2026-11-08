import { useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { useSettings } from '@/domain/settings/SettingsContext';
import type { Tip } from '@/domain/settings/models/onboarding';
import { measureInWindow, type Rect } from '../utils/measureInWindow';

/**
 * How long the next tip waits once one is dismissed: long enough for the last to fade, short
 * enough that a run of tips moves along. Only the first waits for the screen (`settleMs`).
 */
const NEXT_TIP_MS = 120;

export type ShownTip = {
  tip: Tip;
  /**
   * Where the thing it points at sits on screen (the tip covers the whole window), or null
   * when it can't be found, and the tip stands on its own.
   */
  rect: Rect | null;
  /** 1-based, among the tips that apply right now. */
  position: number;
  total: number;
};

/**
 * One screen's one-time tips, one at a time and in order. Only `relevant` ones show (the rest
 * are skipped and left out of the count, and can come up another day); they wait until the
 * setup wizard is done, the screen is in view, and `ready` (nothing else is on top of it).
 * `settleMs` lets the screen finish animating in before the first tip measures what it points
 * at; the ones after it follow on quickly (`NEXT_TIP_MS`).
 */
export function useTips({
  group,
  relevant,
  anchors,
  rootRef,
  outside = [],
  ready,
  settleMs = 600,
}: {
  /** All of this screen's tips, so "Skip tips" can settle them all. */
  group: readonly Tip[];
  relevant: readonly Tip[];
  anchors: Partial<Record<Tip, React.RefObject<View | null>>>;
  /** The screen's root view, to tell whether an anchor is on screen. */
  rootRef: React.RefObject<View | null>;
  /**
   * Tips whose anchor sits outside the screen's root, such as the tab bar below it. They only
   * need to be found, not inside the root.
   */
  outside?: readonly Tip[];
  ready: boolean;
  settleMs?: number;
}) {
  const { settings, updateSettings } = useSettings();
  const { onboarding } = settings;
  const isFocused = useIsFocused();
  const [shown, setShown] = useState<ShownTip | null>(null);
  // Whether a tip has shown since the screen came into view, so the next needn't settle again.
  const running = useRef(false);

  const pending = relevant.filter((t) => !onboarding.tipsSeen.includes(t));
  const active =
    onboarding.wizardDone && isFocused && ready && pending.length > 0;
  const pendingKey = pending.join();

  useEffect(() => {
    if (!active) {
      setShown(null);
      running.current = false;
      return;
    }
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        const tip = pending[0];
        const anchor = anchors[tip];
        const [root, r] = await Promise.all([
          measureInWindow(rootRef),
          anchor ? measureInWindow(anchor) : Promise.resolve(null),
        ]);
        const y = r && root ? r.y - root.y : -1;
        // Point only at something on screen right now: not missing, not scrolled away. A tip
        // that applies but can't be found still shows, without pointing, and says why in
        // development.
        const onScreen = outside.includes(tip)
          ? r !== null && r.height > 0
          : r !== null &&
            root !== null &&
            y >= 0 &&
            y + r.height <= root.height;
        if (!onScreen && __DEV__)
          console.warn(`Tip "${tip}" shown without pointing`, {
            root,
            anchor: r,
          });
        if (cancelled) return;
        running.current = true;
        setShown({
          tip,
          rect: onScreen ? r : null,
          position: relevant.indexOf(tip) + 1,
          total: relevant.length,
        });
      },
      running.current ? NEXT_TIP_MS : settleMs,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `pendingKey` stands for `pending` (and so `relevant`); anchors are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pendingKey]);

  const markSeen = (tips: readonly Tip[]) => {
    setShown(null);
    updateSettings({
      onboarding: {
        ...onboarding,
        tipsSeen: [...new Set([...onboarding.tipsSeen, ...tips])],
      },
    });
  };

  return {
    shown,
    gotIt: () => shown && markSeen([shown.tip]),
    skipAll: () => markSeen(group),
  };
}
