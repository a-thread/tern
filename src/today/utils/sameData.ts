/** Two day → steps maps with identical contents. */
export function sameSteps(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): boolean {
  if (a === b) return true;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => a[k] === b[k]);
}

/** Two lists of day keys holding the same days, in any order. */
export function sameDays(a: readonly string[], b: readonly string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  const inA = new Set(a);
  return b.every((d) => inA.has(d));
}
