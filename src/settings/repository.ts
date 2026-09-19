import type { AppSettings } from './SettingsContext';

export interface SettingsRepository {
  /** Saved settings, or null if the user has never saved any. */
  load(): Promise<Partial<AppSettings> | null>;
  save(settings: AppSettings): Promise<void>;
}

export function createMemorySettingsRepository(): SettingsRepository {
  let saved: AppSettings | null = null;
  return {
    load: async () => saved,
    save: async (settings) => {
      saved = settings;
    },
  };
}
