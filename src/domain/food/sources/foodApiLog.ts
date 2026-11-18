import type { Portion } from './searchResult';

/** Dev-only logging of raw food API data and our portions; silent in release and tests. */
export const isFoodApiLogOn = () =>
  typeof __DEV__ !== 'undefined' && __DEV__ && process.env.NODE_ENV !== 'test';

/** "cup = 158 g, large egg = 50 g", or "none". */
export const portionsText = (portions: Portion[] | undefined) =>
  portions?.length
    ? portions.map((p) => `${p.label} = ${p.grams} g`).join(', ')
    : 'none';

/** One block per request: a heading, then one line per food. */
export function logFoodApi(heading: string, lines: string[]): void {
  if (!isFoodApiLogOn()) return;
  console.log(
    `[food api] ${heading}\n${lines.map((l) => `  ${l}`).join('\n')}`,
  );
}
