import React, { createContext, useContext, useRef } from 'react';
import type { View } from 'react-native';

import type { TabParamList } from './types';

export type TabName = keyof TabParamList;
export type TabAnchors = Record<TabName, React.RefObject<View | null>>;

/** Null outside the tab navigator (a screen rendered on its own, as in tests). */
const TabAnchorsContext = createContext<TabAnchors | null>(null);

/**
 * Where each tab's icon sits along the bottom, for tips on a tab to point at. The tab bar is
 * drawn by the navigator, outside any one screen, so it shares the refs this way.
 */
export function TabAnchorsProvider({
  children,
}: {
  children: (anchors: TabAnchors) => React.ReactNode;
}) {
  const anchors: TabAnchors = {
    Today: useRef<View>(null),
    Food: useRef<View>(null),
    Trends: useRef<View>(null),
    Journey: useRef<View>(null),
  };
  return (
    <TabAnchorsContext.Provider value={anchors}>
      {children(anchors)}
    </TabAnchorsContext.Provider>
  );
}

/** The tab icons' refs, or null when there's no tab bar to point at. */
export function useTabAnchors(): TabAnchors | null {
  return useContext(TabAnchorsContext);
}
