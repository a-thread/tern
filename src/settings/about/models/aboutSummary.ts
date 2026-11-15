/** The About Tern row on the Settings index. */
export function aboutSummary(supporter: boolean): string {
  return supporter
    ? 'What Tern is for · thank you for supporting it'
    : 'What Tern is for, and supporting it';
}
