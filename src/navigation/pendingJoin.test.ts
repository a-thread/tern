import AsyncStorage from '@react-native-async-storage/async-storage';

import { PendingJoin, rememberJoin, takeRememberedJoin } from './pendingJoin';

const KEY = 'tern:ternary:pending-join';

describe('a kept invite', () => {
  beforeEach(async () => {
    await takeRememberedJoin();
    await AsyncStorage.clear();
  });

  it('is given once, then forgotten', async () => {
    rememberJoin('KTW4QP');
    expect(await takeRememberedJoin()).toBe('KTW4QP');
    expect(await takeRememberedJoin()).toBeNull();
  });

  it('survives the app closing, from what was kept on the phone', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ code: 'ABC234', at: Date.now() }),
    );
    expect(await takeRememberedJoin()).toBe('ABC234');
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });

  it('is dropped once it’s more than a week old', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({
        code: 'ABC234',
        at: Date.now() - PendingJoin.KEEP_MS - 1,
      }),
    );
    expect(await takeRememberedJoin()).toBeNull();
  });
});
