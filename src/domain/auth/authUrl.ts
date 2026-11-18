export type AuthLink = {
  accessToken: string;
  refreshToken: string;
  /** Supabase's link type: 'signup', 'recovery', 'magiclink', … */
  type: string | null;
};

/** Tokens from a confirmation or reset link's fragment; null for any other URL. */
export function parseAuthLink(url: string): AuthLink | null {
  const hash = url.split('#')[1];
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, type: params.get('type') };
}
