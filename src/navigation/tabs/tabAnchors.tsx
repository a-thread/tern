import React, { createContext, useContext, useRef } from 'react';
import type { View } from 'react-native';

import type { TabParamList } from './types';

export type TabName = keyof TabParamList;
export type TabAnchors = Record<TabName, React.RefObject<View | null>>;

/**
 * Null outside the tab navigator (a screen rendered on its own, as in tests), so this one is
 * optional and made with `createContext`, not `createRequiredContext`.
 */
const TabAnchorsContext = createContext<TabAnchors | null>(null);

/**
 * Where each tab's button sits along the bottom, for tips on a tab to point at. The tab bar is
 * drawn by the navigator, outside any one screen, so it shares the refs this way.
 */
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
