/**
 * Publishes a built common-foods list to Supabase, so apps download it.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/publishCommonFoods.ts [build/commonFoods.json]
 *
 * The service-role key bypasses row-level security; keep it in your own
 * environment, never in the app or the repo. The version is a hash of the
 * list, so publishing the same list again doesn't make apps re-download it.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

import type { CommonFood } from '@food/models/commonFoods';

const BATCH = 500;

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');

  const file = process.argv[2] ?? 'build/commonFoods.json';
  const raw = readFileSync(file, 'utf8');
  const foods = JSON.parse(raw) as CommonFood[];
  if (!foods.length) throw new Error(`${file} has no foods.`);
  const version = createHash('sha256').update(raw).digest('hex').slice(0, 16);

  const db = createClient(url, key, { db: { schema: 'tern' }, auth: { persistSession: false } });

  const { data: meta } = await db.from('common_foods_meta').select('version').maybeSingle();
  if ((meta as { version?: string } | null)?.version === version) {
    console.log(`Already published (version ${version}); nothing to do.`);
    return;
  }

  const now = new Date().toISOString();
  for (let i = 0; i < foods.length; i += BATCH) {
    const rows = foods.slice(i, i + BATCH).map((f) => ({
      id: f.id,
      name: f.name,
      detail: f.detail ?? null,
      aliases: f.aliases ?? [],
      kcal: f.kcal,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      portions: f.portions ?? [],
      rank: f.rank,
      tier: f.tier,
      updated_at: now,
    }));
    const { error } = await db.from('common_foods').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    console.log(`Upserted ${Math.min(i + BATCH, foods.length)} of ${foods.length}`);
  }

  // Foods dropped from the list since the last publish.
  const keep = new Set(foods.map((f) => f.id));
  const stale: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('common_foods').select('id').range(from, from + 999);
    if (error) throw error;
    const ids = (data ?? []) as { id: string }[];
    stale.push(...ids.map((r) => r.id).filter((id) => !keep.has(id)));
    if (ids.length < 1000) break;
  }
  for (let i = 0; i < stale.length; i += BATCH) {
    const { error } = await db.from('common_foods').delete().in('id', stale.slice(i, i + BATCH));
    if (error) throw error;
  }
  if (stale.length) console.log(`Removed ${stale.length} foods no longer in the list.`);

  // Last, so apps only see the new version once every row is in place.
  const { error } = await db.from('common_foods_meta').upsert({ id: true, version, updated_at: now });
  if (error) throw error;
  console.log(`Published ${foods.length} foods as version ${version}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
