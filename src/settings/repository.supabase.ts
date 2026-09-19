import type { TernClient } from '@shared/backend/supabase';
import type { AppSettings } from './SettingsContext';
import type { SettingsRepository } from './repository';

export function createSupabaseSettingsRepository(
  db: TernClient,
): SettingsRepository {
  return {
    async load() {
      const { data, error } = await db
        .from('settings')
        .select('data')
        .maybeSingle();
      if (error) throw error;
      return (data?.data as Partial<AppSettings> | undefined) ?? null;
    },
    async save(settings) {
      // user_id defaults to auth.uid(); it's the primary key, so this upserts.
      const { error } = await db
        .from('settings')
        .upsert(
          { data: settings, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      if (error) throw error;
    },
  };
}
