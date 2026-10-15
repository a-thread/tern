import { LayoutAnimation } from 'react-native';

/**
 * Makes the next layout change glide instead of jumping: call it just before the state change
 * that moves things (a card swapped for a taller one, a list appearing). Never throws: a
 * platform without layout animations simply jumps.
 */
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
