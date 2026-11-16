/**
 * The About Tern row on the Settings index. It mentions the tip jar only when the store offers
 * tips, since the jar is hidden otherwise (a build without a store, or a store with no tips).
 */
export function aboutSummary(hasTips: boolean): string {
  return hasTips ? 'Why Tern exists, and a tip jar' : 'Why Tern exists';
}
