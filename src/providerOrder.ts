/** A provider in the app tree and the providers above it that it reads from. */
export type ProviderSpec = { name: string; needs: readonly string[] };

/**
 * Throws if any provider is listed before one it needs. The provider tree is nested in list
 * order, so a provider placed too high would call a hook whose provider isn't mounted yet and
 * fail at runtime; this turns that into an error that names both.
 */
export function assertProviderOrder(specs: readonly ProviderSpec[]): void {
  const seen = new Set<string>();
  for (const { name, needs } of specs) {
    for (const need of needs) {
      if (!seen.has(need)) {
        throw new Error(`${name} needs ${need}, which must be listed before it`);
      }
    }
    seen.add(name);
  }
}
