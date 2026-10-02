/** Rounds to one decimal place. */
export const round1 = (n: number) => Math.round(n * 10) / 10;

/** A number from a number or a numeric string, or undefined for anything else (NaN included). */
export const toFiniteNumber = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};
