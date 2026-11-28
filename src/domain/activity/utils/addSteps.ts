/** Two day → steps maps summed day by day; `a` itself when `b` is empty. */
export function addSteps(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): Record<string, number> {
  const days = Object.keys(b);
  if (!days.length) return a;
  const out = { ...a };
  for (const d of days) out[d] = (out[d] ?? 0) + b[d];
  return out;
}
