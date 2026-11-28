import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tern:ternary:pending-join';

export class PendingJoin {
  /** An invite this old is dropped rather than opening Join out of the blue. */
  static readonly KEEP_MS = 7 * 24 * 60 * 60 * 1000;
}

let pending: string | null = null;

/**
 * Keep an invite code to open Join with once Tern Plus is ready. Kept on the phone too, so
 * it survives the app closing while someone confirms their email.
 */
export function rememberJoin(code: string) {
  pending = code;
  AsyncStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() })).catch(
    () => {},
  );
}

/** The kept code, if any and not too old, and forget it so it's only used once. */
export async function takeRememberedJoin(): Promise<string | null> {
  const inMemory = pending;
  pending = null;
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(KEY);
    if (stored !== null) await AsyncStorage.removeItem(KEY);
  } catch {
    stored = null;
  }
  if (inMemory) return inMemory;
  if (!stored) return null;
  try {
    const { code, at } = JSON.parse(stored) as { code?: unknown; at?: unknown };
    if (typeof code !== 'string' || typeof at !== 'number') return null;
    return Date.now() - at <= PendingJoin.KEEP_MS ? code : null;
  } catch {
    return null;
  }
}
