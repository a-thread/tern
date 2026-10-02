/** A failed request to a food database. `kind` says why, so the UI can word it. */
export class FoodApiError extends Error {
  constructor(
    public kind: 'network' | 'timeout' | 'http',
    message: string,
  ) {
    super(message);
    this.name = 'FoodApiError';
  }
}

const TIMEOUT_MS = 10_000;

/**
 * GET JSON with a timeout. A caller cancelling through `signal` (a newer search
 * replaced this one) is let through untouched; anything else becomes a
 * FoodApiError.
 */
export async function getJson(
  url: string,
  signal?: AbortSignal,
  headers: Record<string, string> = {},
  /** A JSON POST instead of a GET. */
  post?: unknown,
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(url, {
      ...(post !== undefined
        ? { method: 'POST', body: JSON.stringify(post) }
        : {}),
      headers: {
        Accept: 'application/json',
        ...(post !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new FoodApiError('http', `Food database returned ${res.status}`);
    return await res.json();
  } catch (e) {
    if (e instanceof FoodApiError) throw e;
    if (signal?.aborted) throw e;
    throw new FoodApiError(
      ctrl.signal.aborted ? 'timeout' : 'network',
      'Could not reach the food database',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
