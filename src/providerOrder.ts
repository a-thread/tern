/** A provider in the app tree and the providers above it that it reads from. */
export type ProviderSpec = { name: string; needs: readonly string[] };

/** Turns a misordered provider's runtime failure into an error naming both. */
export function assertProviderOrder(specs: readonly ProviderSpec[]): void {
  const seen = new Set<string>();
  for (const { name, needs } of specs) {
    for (const need of needs) {
      if (!seen.has(need)) {
        throw new Error(
          `${name} needs ${need}, which must be listed before it`,
        );
      }
    }
    seen.add(name);
  }
}
