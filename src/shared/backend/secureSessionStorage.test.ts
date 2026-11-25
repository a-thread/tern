import {
  createSecureSessionStorage,
  type SessionStorageApi,
} from './secureSessionStorage';

function fakeApi() {
  const secure = new Map<string, string>();
  const plain = new Map<string, string>();
  const store = (map: Map<string, string>) => ({
    get: async (k: string) => map.get(k) ?? null,
    set: async (k: string, v: string) => {
      map.set(k, v);
    },
    remove: async (k: string) => {
      map.delete(k);
    },
  });
  let n = 0;
  const api: SessionStorageApi = {
    secure: store(secure),
    plain: store(plain),
    randomBytes: (count) => Uint8Array.from({ length: count }, () => n++ % 256),
  };
  return { api, secure, plain };
}

const KEY = 'sb-project-auth-token';
const session = JSON.stringify({ access_token: 'a', refresh_token: 'r' });

describe('secure session storage', () => {
  it('reads back what it saved, without the plain text in AsyncStorage', async () => {
    const { api, plain, secure } = fakeApi();
    const storage = createSecureSessionStorage(api);
    await storage.setItem(KEY, session);
    expect(await storage.getItem(KEY)).toBe(session);
    expect(plain.get(KEY)).not.toContain('refresh_token');
    expect(secure.has(`${KEY}.aes`)).toBe(true);
  });

  it('keeps a session larger than SecureStore holds', async () => {
    const { api, secure } = fakeApi();
    const storage = createSecureSessionStorage(api);
    const big = JSON.stringify({ token: 'x'.repeat(5000) });
    await storage.setItem(KEY, big);
    expect(await storage.getItem(KEY)).toBe(big);
    // Only the 32-byte key goes into the Keychain / Keystore.
    expect(secure.get(`${KEY}.aes`)).toHaveLength(64);
  });

  it('keeps its key across saves, with a fresh IV each time', async () => {
    const { api, plain, secure } = fakeApi();
    const storage = createSecureSessionStorage(api);
    await storage.setItem(KEY, session);
    const key = secure.get(`${KEY}.aes`);
    const first = plain.get(KEY);
    await storage.setItem(KEY, session);
    expect(secure.get(`${KEY}.aes`)).toBe(key);
    expect(plain.get(KEY)).not.toBe(first);
    expect(await storage.getItem(KEY)).toBe(session);
  });

  it('still reads the last session when a later save is cut short', async () => {
    const { api } = fakeApi();
    const storage = createSecureSessionStorage(api);
    await storage.setItem(KEY, session);
    api.plain.set = async () => {
      throw new Error('killed');
    };
    await expect(storage.setItem(KEY, '{"newer":true}')).rejects.toThrow();
    expect(await storage.getItem(KEY)).toBe(session);
  });

  it('drops a session whose key was not restored with it, rather than return ciphertext', async () => {
    const { api, plain, secure } = fakeApi();
    const storage = createSecureSessionStorage(api);
    await storage.setItem(KEY, session);
    // An Android restore brings AsyncStorage back but not SecureStore.
    secure.clear();
    expect(await storage.getItem(KEY)).toBeNull();
    expect(plain.has(KEY)).toBe(false);
  });

  it('removes both halves', async () => {
    const { api, plain, secure } = fakeApi();
    const storage = createSecureSessionStorage(api);
    await storage.setItem(KEY, session);
    await storage.removeItem(KEY);
    expect(await storage.getItem(KEY)).toBeNull();
    expect(plain.size + secure.size).toBe(0);
  });

  it('is null for a session never saved', async () => {
    const { api } = fakeApi();
    expect(await createSecureSessionStorage(api).getItem(KEY)).toBeNull();
  });

  it('keeps a session saved in plain text before this, and encrypts it in place', async () => {
    const { api, plain } = fakeApi();
    plain.set(KEY, session);
    const storage = createSecureSessionStorage(api);
    expect(await storage.getItem(KEY)).toBe(session);
    expect(plain.get(KEY)).not.toContain('refresh_token');
    expect(await storage.getItem(KEY)).toBe(session);
  });
});
