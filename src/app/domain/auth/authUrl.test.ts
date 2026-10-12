import { parseAuthLink } from './authUrl';

describe('parseAuthLink', () => {
  it('reads tokens and type from the fragment', () => {
    expect(
      parseAuthLink('tern://#access_token=aaa&refresh_token=bbb&type=recovery'),
    ).toEqual({ accessToken: 'aaa', refreshToken: 'bbb', type: 'recovery' });
  });

  it('works with an Expo Go dev URL', () => {
    expect(
      parseAuthLink(
        'exp://192.168.1.5:8081/--/#access_token=a&refresh_token=b&type=signup',
      ),
    ).toMatchObject({ accessToken: 'a', type: 'signup' });
  });

  it('ignores URLs without both tokens', () => {
    expect(parseAuthLink('tern://home')).toBeNull();
    expect(parseAuthLink('tern://#access_token=a')).toBeNull();
  });
});
