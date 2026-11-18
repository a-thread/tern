import type { Tier } from '@/domain/food/models/foodEntry';
import { FoodSource } from '@/domain/food/models/foodSource';

/** Null means no note. `source` is unset for your own foods. */
export function tierSuggestionNote(
  suggested: Tier | null | undefined,
  source: FoodSource | undefined,
): string | null {
  if (!suggested) return source ? 'No processing data for this food.' : null;
  if (source === FoodSource.Off)
    return `Suggested from Open Food Facts processing data (NOVA ${suggested}).`;
  if (source === FoodSource.Common)
    return `Suggested for this kind of food (NOVA ${suggested}).`;
  return 'The type you chose last time.';
}
