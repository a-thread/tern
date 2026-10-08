import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import type { CommonFoodsRepository } from '@food/data/commonFoods.repository';
import {
  buildCommonIndex,
  emptyCommonIndex,
  type CommonFood,
  type CommonFoodIndex,
} from '@food/models/commonFoods';

type CommonFoodsContextValue = {
  /** The list, ready to search. Empty until a copy is loaded. */
  index: CommonFoodIndex;
  /** The version on the phone, or null before the first download. */
  version: string | null;
};

const [CommonFoodsContext, useCommonFoods] = createRequiredContext<CommonFoodsContextValue>(
  'useCommonFoods',
  'CommonFoodsProvider',
);
export { useCommonFoods };

/** Where the downloaded list is kept between launches. */
export const COMMON_FOODS_KEY = 'tern.commonFoods';

type Stored = { version: string; foods: CommonFood[] };

const isStored = (v: unknown): v is Stored =>
  !!v &&
  typeof (v as Stored).version === 'string' &&
  Array.isArray((v as Stored).foods);

/**
 * The common-foods list, searched on the phone. The copy from the last launch
 * is used straight away; the backend is then asked for its version, and the
 * list is downloaded only when it changed. Never holds the app back: until a
 * copy exists, search simply has no common foods.
 */
export function CommonFoodsProvider({
  repo,
  children,
}: {
  repo: CommonFoodsRepository;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<CommonFoodsContextValue>({
    index: emptyCommonIndex,
    version: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let have: string | null = null;
      try {
        const raw = await AsyncStorage.getItem(COMMON_FOODS_KEY);
        const stored: unknown = raw ? JSON.parse(raw) : null;
        if (isStored(stored)) {
          have = stored.version;
          if (!cancelled) setState({ version: stored.version, index: buildCommonIndex(stored.foods) });
        }
      } catch (e) {
        console.warn('Could not read the saved common foods', e);
      }
      try {
        const version = await repo.version();
        if (cancelled || !version || version === have) return;
        const foods = await repo.loadAll();
        if (cancelled) return;
        setState({ version, index: buildCommonIndex(foods) });
        await AsyncStorage.setItem(COMMON_FOODS_KEY, JSON.stringify({ version, foods } satisfies Stored));
      } catch (e) {
        console.warn('Could not update the common foods', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const value = useMemo(() => state, [state]);
  return <CommonFoodsContext.Provider value={value}>{children}</CommonFoodsContext.Provider>;
}
