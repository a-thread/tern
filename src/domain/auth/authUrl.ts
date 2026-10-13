export type AuthLink = {
  accessToken: string;
  refreshToken: string;
  /** Supabase's link type: 'signup', 'recovery', 'magiclink', … */
  type: string | null;
};

/**
 * Reads the session tokens Supabase puts in the URL fragment when someone
 * taps a confirmation or password-reset link in their email and it opens the
 * app. Returns null for any URL that isn't one of those.
 */
export function parseAuthLink(url: string): AuthLink | null {
  const hash = url.split('#')[1];
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, type: params.get('type') };
}
