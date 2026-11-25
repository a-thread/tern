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

const KEY_BYTES = 32;
const keyName = (key: string) => `${key}.aes`;

/**
 * Supabase's "LargeSecureStore": a session outgrows SecureStore's ~2 KB, so an AES key for it
 * lives in the Keychain / Keystore and only the ciphertext sits in AsyncStorage.
 */
export function createSecureSessionStorage(
  api: SessionStorageApi,
): SessionStorage {
  const encrypt = async (key: string, value: string) => {
    const aesKey = api.randomBytes(KEY_BYTES);
    const cipher = new aesjs.ModeOfOperation.ctr(aesKey, new aesjs.Counter(1));
    const bytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await api.secure.set(keyName(key), aesjs.utils.hex.fromBytes(aesKey));
    await api.plain.set(key, aesjs.utils.hex.fromBytes(bytes));
  };

  return {
    async getItem(key) {
      const stored = await api.plain.get(key);
      if (stored === null) return null;
      const hexKey = await api.secure.get(keyName(key));
      if (hexKey === null) {
        // A session saved before this was plain text: encrypt it in place, so nobody is signed out.
        await encrypt(key, stored);
        return stored;
      }
      const cipher = new aesjs.ModeOfOperation.ctr(
        aesjs.utils.hex.toBytes(hexKey),
        new aesjs.Counter(1),
      );
      return aesjs.utils.utf8.fromBytes(
        cipher.decrypt(aesjs.utils.hex.toBytes(stored)),
      );
    },
    setItem: encrypt,
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
