import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Whether the person has asked their phone to cut back on motion; follows the setting while mounted. */
export function useReduceMotion(): boolean {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => alive && setOn(enabled))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => alive && setOn(enabled),
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return on;
}
