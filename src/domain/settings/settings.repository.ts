import type { AppSettings } from './models/appSettings';

export interface SettingsRepository {
  /** Saved settings, or null if the user has never saved any. */
  load(): Promise<Partial<AppSettings> | null>;
  save(settings: AppSettings): Promise<void>;
  /**
   * Whether anything has ever been logged (food, a weigh-in, a waypoint…). Settings are only
   * saved once one changes, so this is what tells someone already using Tern from a new install.
   */
  hasLoggedAnything(): Promise<boolean>;
}

export function createMemorySettingsRepository(
  logged = false,
): SettingsRepository {
  let saved: AppSettings | null = null;
  return {
    load: async () => saved,
    save: async (settings) => {
      saved = settings;
    },
    hasLoggedAnything: async () => logged,
  };
}
