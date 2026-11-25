import { Platform } from 'react-native';

export class LegalUrls {
  static readonly PRIVACY = 'https://a-thread.github.io/tern/';
  /** Tern has no terms of its own; on iPhone it uses Apple's standard licence agreement. */
  static readonly APPLE_TERMS =
    'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
}

export type LegalLink = { label: string; url: string };

/**
 * What the paywall links to, as the stores ask of a subscription: the privacy policy everywhere,
 * and on iPhone the terms of use too (App Review guideline 3.1.2).
 */
export function legalLinks(os = Platform.OS): LegalLink[] {
  const privacy = { label: 'Privacy Policy', url: LegalUrls.PRIVACY };
  return os === 'ios'
    ? [{ label: 'Terms of Use', url: LegalUrls.APPLE_TERMS }, privacy]
    : [privacy];
}
