/** Mentions the tip jar only when the store offers tips. */
export function aboutSummary(hasTips: boolean): string {
  return hasTips ? 'Why Tern exists, and a tip jar' : 'Why Tern exists';
}
