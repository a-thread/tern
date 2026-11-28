import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

import { codeFromLink } from '../domain/ternary/models/joinLink';
import type { RootStackParamList } from './types';
import { takeRememberedJoin } from './pendingJoin';

type Nav = NavigationContainerRefWithCurrent<RootStackParamList>;

// The last link opened, so a remount doesn't open Join again for the same one.
let handled: string | null = null;

/**
 * Opens Join a ternary with the code filled in when Tern is opened by a join link, whether it
 * launched the app or arrived while it was open, and again once someone who signed up for
 * Tern Plus to join is in (`rememberJoin`). Waits until the app is `ready` for it.
 */
export function useJoinLinkNavigation(nav: Nav, ready: boolean) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    Linking.getInitialURL()
      .then((first) => first && setUrl(first))
      .catch(() => {});
    const sub = Linking.addEventListener('url', (e) => setUrl(e.url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready || !nav.isReady()) return;
    // `initial: false` keeps the ternary's home under it, so Back has somewhere to go.
    const openJoin = (code: string) =>
      nav.navigate('Ternary', {
        screen: 'JoinTernary',
        params: { code },
        initial: false,
      });
    let linked: string | null = null;
    if (url && url !== handled) {
      handled = url;
      linked = codeFromLink(url);
    }
    if (linked) return openJoin(linked);
    let alive = true;
    takeRememberedJoin()
      .then((kept) => alive && kept && openJoin(kept))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready, url, nav]);
}
