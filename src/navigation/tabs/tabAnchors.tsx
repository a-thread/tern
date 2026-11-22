import React, { createContext, useContext, useRef } from 'react';
import type { HostInstance } from 'react-native';

import type { TabParamList } from './types';

export type TabName = keyof TabParamList;
export type TabAnchors = Record<TabName, React.RefObject<HostInstance | null>>;

/** Optional (`createContext`): null outside the tab navigator, as in tests. */
const TabAnchorsContext = createContext<TabAnchors | null>(null);

/** The tab bar lives outside any screen, so its refs are shared this way. */
export function TabAnchorsProvider({
  children,
}: {
  children: (anchors: TabAnchors) => React.ReactNode;
}) {
  const today = useRef<HostInstance>(null);
  const food = useRef<HostInstance>(null);
  const trends = useRef<HostInstance>(null);
  const journey = useRef<HostInstance>(null);
  const anchors = useRef<TabAnchors>({
    Today: today,
    Food: food,
    Trends: trends,
    Journey: journey,
  }).current;
  return (
    <TabAnchorsContext.Provider value={anchors}>
      {children(anchors)}
    </TabAnchorsContext.Provider>
  );
}

/** The tab buttons' refs, or null when there's no tab bar to point at. */
export function useTabAnchors(): TabAnchors | null {
  return useContext(TabAnchorsContext);
}
