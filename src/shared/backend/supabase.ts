import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Only the origin matters: the client adds /auth/v1, /rest/v1 itself, so a URL
// pasted with one of those suffixes (the dashboard shows the REST one) would
// make every request fail with "invalid path specified in the request".
const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const url = rawUrl ? new URL(rawUrl).origin : undefined;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False when no keys are set — the app then runs entirely on local mock data. */
export const isBackendConfigured = Boolean(url && anonKey);

/** Tern's tables live in the `tern` schema (see supabase/migrations). */
export type TernClient = SupabaseClient<any, 'tern', any>;

export const supabase: TernClient | null = isBackendConfigured
  ? createClient(url!, anonKey!, {
      db: { schema: 'tern' },
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Only refresh tokens while the app is in the foreground.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
