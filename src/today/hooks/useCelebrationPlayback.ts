import { useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import {
  useWaypoints,
  type Celebration,
} from '../../domain/waypoints/WaypointsContext';
import { measureInWindow, type Rect } from '@shared/utils/measureInWindow';

type Point = { x: number; y: number };
export type Playing = {
  celebration: Celebration;
  origin: Point;
  target: Point;
};

/** Stands in for a view that couldn't be measured, so a celebration still plays. */
const NOWHERE: Rect = { x: 0, y: 0, width: 0, height: 0 };

/** Plays only while Today is focused; `hold` waits for the tern to land. */
export function useCelebrationPlayback(hold = false) {
  const insets = useSafeAreaInsets();
  const { celebrations } = useWaypoints();
  const isFocused = useIsFocused();
  const rootRef = useRef<View>(null);
  const heroRef = useRef<View>(null);
  const chipRef = useRef<View>(null);
  const [playing, setPlaying] = useState<Playing | null>(null);
  const starting = useRef(false);
  const nextCelebration = celebrations[0];

  useEffect(() => {
    if (hold || !isFocused || playing || starting.current || !nextCelebration)
      return;
    starting.current = true;
    (async () => {
      const [root, hero, chip] = (
        await Promise.all([
          measureInWindow(rootRef),
          measureInWindow(heroRef),
          measureInWindow(chipRef),
        ])
      ).map((r) => r ?? NOWHERE);
      const inRoot = (r: Rect): Point => ({
        x: r.x - root.x + r.width / 2,
        y: r.y - root.y + r.height / 2,
      });
      const origin = inRoot(hero);
      origin.y = Math.min(
        Math.max(origin.y, insets.top + 90),
        root.height - 160,
      );
      setPlaying({
        celebration: nextCelebration,
        origin,
        target: inRoot(chip),
      });
      starting.current = false;
    })();
  }, [hold, isFocused, playing, nextCelebration, insets.top]);

  return { rootRef, heroRef, chipRef, playing, finish: () => setPlaying(null) };
}
