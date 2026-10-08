import type { CommonFood } from '@food/models/commonFoods';
import { commonFoodsSeed } from './commonFoods.seed';

/**
 * The shared common-foods list. It is the same for everyone and changes rarely,
 * so the app keeps a copy and only downloads it again when `version` changes.
 */
export interface CommonFoodsRepository {
  /** An opaque version of the list; null when there is no list yet. */
  version(): Promise<string | null>;
  loadAll(): Promise<CommonFood[]>;
}

export function createMemoryCommonFoodsRepository(
  foods: CommonFood[] = commonFoodsSeed,
  version = 'seed-1',
): CommonFoodsRepository {
  return {
    version: async () => version,
    loadAll: async () => [...foods],
  };
}
