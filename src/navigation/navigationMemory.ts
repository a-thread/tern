import type { InitialState, NavigationState } from '@react-navigation/native';

/**
 * Where the app was, kept outside the NavigationContainer. The sign-in screens replace the
 * whole app (and a change of account remounts it), so without this, leaving them would land
 * on Today instead of back in Settings where sign-in was opened. Memory only: a fresh launch
 * still starts on Today.
 */
let last: NavigationState | undefined;

export function rememberNavigation(state: NavigationState | undefined) {
  last = state;
}

export function lastNavigation(): InitialState | undefined {
  return last;
}
