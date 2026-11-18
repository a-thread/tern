import { LayoutAnimation } from 'react-native';

/** Call just before the state change. Never throws. */
export function easeLayout(ms = 260): void {
  try {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        ms,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
  } catch {
    // no layout animations here
  }
}
