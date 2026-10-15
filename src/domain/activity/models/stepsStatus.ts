/**
 * - `connected`: a step source is readable.
 * - `needs-permission`: a source exists, but the user hasn't allowed reading it yet.
 * - `unavailable`: no step source on this device or build (e.g. Expo Go).
 */
export enum StepsStatus {
  Connected = 'connected',
  NeedsPermission = 'needs-permission',
  Unavailable = 'unavailable',
}
