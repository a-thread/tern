import { useWindowDimensions } from 'react-native';

/** Android's "medium" width class: unfolded foldables, tablets and phones on their side. */
const WIDE_MIN_WIDTH = 600;

/** Whether Journey shows its map and lists side by side. */
export function useWideLayout(): boolean {
  return useWindowDimensions().width >= WIDE_MIN_WIDTH;
}
