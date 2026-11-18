import React, { createContext, useContext, useRef } from 'react';
import type { View } from 'react-native';

import type { TabParamList } from './types';

export type TabName = keyof TabParamList;
export type TabAnchors = Record<TabName, React.RefObject<View | null>>;

/** Optional (`createContext`): null outside the tab navigator, as in tests. */
const TabAnchorsContext = createContext<TabAnchors | null>(null);

/** The tab bar lives outside any screen, so its refs are shared this way. */
export function TabAnchorsProvider({
  children,
}: {
  children: (anchors: TabAnchors) => React.ReactNode;
}) {
  const today = useRef<View>(null);
  const food = useRef<View>(null);
  const trends = useRef<View>(null);
  const journey = useRef<View>(null);
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
