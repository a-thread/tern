import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytes } from 'expo-crypto';
import aesjs from 'aes-js';

/** What the session storage needs from the phone, so it tests without native modules. */
export type SessionStorageApi = {
  secure: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };
  plain: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };
  randomBytes(count: number): Uint8Array;
};

export type SessionStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

class SessionCipher {
  static readonly KEY_BYTES = 32;
  static readonly IV_BYTES = 16;
  /** What a stored ciphertext looks like: a hex IV, a colon, then hex. */
  static readonly STORED = /^[0-9a-f]{32}:[0-9a-f]*$/;
}

const keyName = (key: string) => `${key}.aes`;

const ctr = (hexKey: string, iv: Uint8Array) =>
  new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(hexKey),
    new aesjs.Counter(iv),
  );

/**
 * Supabase's "LargeSecureStore": a session outgrows SecureStore's ~2 KB, so an AES key for it
 * lives in the Keychain / Keystore and only the ciphertext sits in AsyncStorage.
 */
export function createSecureSessionStorage(
  api: SessionStorageApi,
): SessionStorage {
  // One key per name, kept across saves; each save gets a fresh IV, so a save is one write.
  const keyFor = async (key: string) => {
    const existing = await api.secure.get(keyName(key));
    if (existing) return existing;
    const created = aesjs.utils.hex.fromBytes(
      api.randomBytes(SessionCipher.KEY_BYTES),
    );
    await api.secure.set(keyName(key), created);
    return created;
  };

  const setItem = async (key: string, value: string) => {
    const iv = api.randomBytes(SessionCipher.IV_BYTES);
    const bytes = ctr(await keyFor(key), iv).encrypt(
      aesjs.utils.utf8.toBytes(value),
    );
    await api.plain.set(
      key,
      `${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(bytes)}`,
    );
  };

  return {
    async getItem(key) {
      const stored = await api.plain.get(key);
      if (stored === null) return null;
      if (!SessionCipher.STORED.test(stored)) {
        // Saved in plain text before this: encrypt it in place, so nobody is signed out.
        await setItem(key, stored);
        return stored;
      }
      const hexKey = await api.secure.get(keyName(key));
      if (!hexKey) {
        // Restored from a backup without its key (Android keeps SecureStore out of backups):
        // unreadable, so drop it and sign in again.
        await api.plain.remove(key);
        return null;
      }
      const [iv, cipher] = stored.split(':');
      return aesjs.utils.utf8.fromBytes(
        ctr(hexKey, aesjs.utils.hex.toBytes(iv)).decrypt(
          aesjs.utils.hex.toBytes(cipher),
        ),
      );
    },
    setItem,
    async removeItem(key) {
      await api.plain.remove(key);
      await api.secure.remove(keyName(key));
    },
  };
}

const SECURE_OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

export const secureSessionStorage = createSecureSessionStorage({
  secure: {
    get: (key) => SecureStore.getItemAsync(key, SECURE_OPTIONS),
    set: (key, value) => SecureStore.setItemAsync(key, value, SECURE_OPTIONS),
    remove: (key) => SecureStore.deleteItemAsync(key, SECURE_OPTIONS),
  },
  plain: {
    get: (key) => AsyncStorage.getItem(key),
    set: (key, value) => AsyncStorage.setItem(key, value),
    remove: (key) => AsyncStorage.removeItem(key),
  },
  randomBytes: getRandomBytes,
});
