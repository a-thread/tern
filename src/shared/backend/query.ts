/** What a Supabase query resolves to: rows or a count in `data`, or the failure in `error`. */
type Outcome = { data?: unknown; error: unknown };

/** Runs a query that returns nothing we need (insert, update, delete, upsert), throwing if it failed. */
export async function ok(query: PromiseLike<Outcome>): Promise<void> {
  const { error } = await query;
  if (error) throw error;
}

/** Runs a select and returns its rows, throwing if it failed. A query that matched nothing gives `[]`. */
export async function rows<T>(query: PromiseLike<Outcome>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}

/**
 * How many rows `allRows` asks for at once. It must not be more than the API's `max_rows`
 * (1000 on Supabase unless changed), or a full page would look short and end the read early.
 */
const PAGE = 1000;

/**
 * Runs a select a page at a time and returns every row, so a long history is never cut off at
 * the server's row cap. `page(from, to)` builds the query for rows `from`..`to` (inclusive, as
 * `.range` takes them); its order must be unique per row, or rows can repeat or go missing
 * between pages. Stops at the first page shorter than asked for.
 */
export async function allRows<T>(
  page: (from: number, to: number) => PromiseLike<Outcome>,
  size = PAGE,
): Promise<T[]> {
  const found: T[] = [];
  for (;;) {
    const next = await rows<T>(page(found.length, found.length + size - 1));
    found.push(...next);
    if (next.length < size) return found;
  }
}
