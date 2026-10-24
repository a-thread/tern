import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// The last answer the phone gave, so a screen mounted later starts with it instead of animating
// for the frame it takes to ask again.
let lastKnown = false;

/** Whether the person has asked their phone to cut back on motion; follows the setting while mounted. */
export function useReduceMotion(): boolean {
  const [on, setOn] = useState(lastKnown);

  useEffect(() => {
    let alive = true;
    const update = (enabled: boolean) => {
      lastKnown = enabled;
      if (alive) setOn(enabled);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      update,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return on;
}
