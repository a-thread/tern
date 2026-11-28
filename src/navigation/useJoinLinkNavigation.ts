import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

import { codeFromLink } from '../domain/ternary/models/joinLink';
import type { RootStackParamList } from './types';

type Nav = NavigationContainerRefWithCurrent<RootStackParamList>;

// The last link opened, so a remount doesn't open Join again for the same one.
let handled: string | null = null;

/**
 * Opens Join a ternary with the code filled in when Tern is opened by a join link, whether it
 * launched the app or arrived while it was open. Waits until the app is `ready` for it.
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
    if (!ready || !url || url === handled || !nav.isReady()) return;
    handled = url;
    const code = codeFromLink(url);
    if (!code) return;
    // `initial: false` keeps the ternary's home under it, so Back has somewhere to go.
    nav.navigate('Ternary', {
      screen: 'JoinTernary',
      params: { code },
      initial: false,
    });
  }, [ready, url, nav]);
}
