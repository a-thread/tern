import type React from 'react';
import type { View } from 'react-native';

export type Rect = { x: number; y: number; width: number; height: number };

/** Null when unmounted, so callers don't wait forever. */
export function measureInWindow(
  ref: React.RefObject<View | null>,
): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!ref.current) {
      resolve(null);
      return;
    }
    ref.current.measureInWindow((x, y, width, height) =>
      resolve(width || height ? { x, y, width, height } : null),
    );
  });
}
