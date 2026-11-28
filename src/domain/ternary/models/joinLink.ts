import { cleanInviteCode, TernaryRules } from './ternary';

export class JoinLinks {
  /** The web page a shared invite links to: it opens Tern, or says how to get it. */
  static readonly WEB = 'https://purlieus.dev/tern/join/';
  /** The app's own link, which the web page opens: tern://join/KTW4QP. */
  static readonly APP = 'tern://join/';
}

/** The link to share for a ternary's invite code. */
export const joinLinkFor = (code: string) =>
  `${JoinLinks.WEB}?code=${encodeURIComponent(code)}`;

/**
 * The invite code in a join link, either the app's (tern://join/KTW4QP) or the web page's
 * (…/tern/join/?code=KTW4QP); null for any other link or a code that can't be one.
 */
export function codeFromLink(url: string | null | undefined): string | null {
  if (!url) return null;
  const app = /^tern:\/\/\/?join\/([^/?#]+)/i.exec(url);
  const web = /\/tern\/join\/?\?(?:.*&)?code=([^&#]+)/i.exec(url);
  const raw = app?.[1] ?? web?.[1];
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const code = cleanInviteCode(decoded);
  return code.length === TernaryRules.INVITE_LENGTH ? code : null;
}
