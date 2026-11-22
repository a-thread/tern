import type { AppSettings } from './models/appSettings';

export interface SettingsRepository {
  /** Saved settings, or null if the user has never saved any. */
  load(): Promise<Partial<AppSettings> | null>;
  save(settings: AppSettings): Promise<void>;
  /** Settings save only on change, so this tells an install in use from a new one. */
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
