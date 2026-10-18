/** "2,310 steps · ☀ 9 days" under the rest day scene; no sun when there is no streak to show. */
export function restDetail(steps: number, streak: number): string {
  const sun =
    streak > 0 ? ` · ☀ ${streak} ${streak === 1 ? 'day' : 'days'}` : '';
  return `${steps.toLocaleString()} steps${sun}`;
}
