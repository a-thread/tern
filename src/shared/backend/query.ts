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
