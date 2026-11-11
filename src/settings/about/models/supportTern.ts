import { plusUnlocked } from '@/domain/subscription/plusUnlocked';

/** Ways to support Tern besides Tern Plus. */
export class SupportTern {
  /** A one-off tip on Buy Me a Coffee, outside the stores. */
  static readonly COFFEE_URL = 'https://buymeacoffee.com/athread';

  /**
   * Whether the app links to Buy Me a Coffee. Google Play (Payments policy, section 4) and the
   * App Store don't allow an app to lead people to pay outside the store, tips included, so
   * store builds don't: they have the tip jar instead, paid through the store. Test builds,
   * which are sideloaded or run in development, still do.
   */
  static showCoffee(): boolean {
    return __DEV__ || plusUnlocked();
  }
}

/** The About Tern row on the Settings index. */
export function aboutSummary(supporter: boolean): string {
  return supporter
    ? 'What Tern is for · thank you for supporting it'
    : 'What Tern is for, and supporting it';
}
