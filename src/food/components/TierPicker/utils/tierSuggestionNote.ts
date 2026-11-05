import type { Tier } from '@/domain/food/models/foodEntry';
import { FoodSource } from '@/domain/food/models/foodSource';

/**
 * The line under the food-type picker saying where the pre-picked type came from. `source` is
 * unset for a food you logged before (its suggestion is your last choice) and for one you made
 * yourself (nothing to say: the info sheet explains the levels). Null means no note.
 */
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
