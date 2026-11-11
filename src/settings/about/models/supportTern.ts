/** Ways to support Tern besides Tern Plus. */
export class SupportTern {
  /** A one-off tip, on Buy Me a Coffee. */
  static readonly COFFEE_URL = 'https://buymeacoffee.com/athread';
  /**
   * Whether the app links to it. The App Store and Google Play both limit links to paying
   * outside the store, tips included, so this is the one switch to turn it off for a store
   * build if review objects.
   */
  static readonly SHOW_COFFEE = true;
}

/** The About Tern row on the Settings index. */
export function aboutSummary(supporter: boolean): string {
  return supporter
    ? 'What Tern is for · thank you for supporting it'
    : 'What Tern is for, and supporting it';
}
