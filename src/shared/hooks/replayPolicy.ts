/** How long you must be away from a screen before its animations play again. */
export const REPLAY_AFTER_MS = 60_000;

export type LastPlay = { at: number; value: number };

/** Whether entrance animations should play when a screen comes into view. */
export function shouldReplay(
  last: LastPlay | null,
  now: number,
  value: number,
): boolean {
  if (!last) return true;
  if (value !== last.value) return true;
  return now - last.at >= REPLAY_AFTER_MS;
}
