/**
 * An invite code kept while someone signs up for Tern Plus to use it. In memory only: it
 * outlives the app's screens being rebuilt for the new account, not the app closing.
 */
let pending: string | null = null;

/** Keep `code` to open Join with once Tern Plus is ready. */
export function rememberJoin(code: string) {
  pending = code;
}

/** The kept code, if any, and forget it so it's only used once. */
export function takeRememberedJoin(): string | null {
  const code = pending;
  pending = null;
  return code;
}
