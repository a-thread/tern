import type { InitialState, NavigationState } from '@react-navigation/native';

/** Sign-in remounts the app, so this returns it to Settings. Memory only: launches start on Today. */
let last: NavigationState | undefined;

export function rememberNavigation(state: NavigationState | undefined) {
  last = state;
}

export function lastNavigation(): InitialState | undefined {
  return last;
}
