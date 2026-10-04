import { useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import { useWaypoints, type Celebration } from '@journey/WaypointsContext';

type Point = { x: number; y: number };
export type Playing = { celebration: Celebration; origin: Point; target: Point };

function measureInWindow(ref: React.RefObject<View | null>) {
  return new Promise<{ x: number; y: number; width: number; height: number }>((resolve) =>
    ref.current?.measureInWindow((x, y, width, height) => resolve({ x, y, width, height })),
  );
}

/**
 * Plays the next queued waypoint award while Today is actually on screen — an award made in
 * the food-logging sheet waits until you are back. The feathers fly from the hero card to the
 * waypoint chip, so the three views are measured and handed back as refs.
 */
export function useCelebrationPlayback() {
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
    if (!isFocused || playing || starting.current || !nextCelebration) return;
    starting.current = true;
    (async () => {
      const [root, hero, chip] = await Promise.all([
        measureInWindow(rootRef),
        measureInWindow(heroRef),
        measureInWindow(chipRef),
      ]);
      const inRoot = (r: typeof hero): Point => ({
        x: r.x - root.x + r.width / 2,
        y: r.y - root.y + r.height / 2,
      });
      const origin = inRoot(hero);
      origin.y = Math.min(Math.max(origin.y, insets.top + 90), root.height - 160);
      setPlaying({ celebration: nextCelebration, origin, target: inRoot(chip) });
      starting.current = false;
    })();
  }, [isFocused, playing, nextCelebration, insets.top]);

  return { rootRef, heroRef, chipRef, playing, finish: () => setPlaying(null) };
}
