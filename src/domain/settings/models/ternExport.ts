/** Everything Tern holds about one person, as stored (weights are in pounds). */
export type TernExport = {
  exportedAt: string;
  weightUnit: 'lb';
  settings: unknown;
  food: unknown[];
  weight: unknown[];
  waypoints: unknown[];
  restDays: unknown[];
  savedMeals: unknown[];
  medicationDoses: unknown[];
  waterEntries: unknown[];
  moodCheckins: unknown[];
  mealCheckins: unknown[];
  skippedMeals: unknown[];
  skippedWeighIns: unknown[];
  movementEntries: unknown[];
};

/** The lists in an export, each one table's rows. */
export const EXPORT_LISTS = [
  'food',
  'weight',
  'waypoints',
  'restDays',
  'savedMeals',
  'medicationDoses',
  'waterEntries',
  'moodCheckins',
  'mealCheckins',
  'skippedMeals',
  'skippedWeighIns',
  'movementEntries',
] as const satisfies readonly (keyof TernExport)[];

export type ParsedExport =
  | { ok: true; copy: TernExport }
  | { ok: false; message: string };

const NOT_TERN = "This file isn't a Tern export.";

/**
 * Reads a file chosen to restore from. Only the overall shape is checked here; a row that
 * doesn't fit is skipped when it's written, so one bad row never blocks the rest. A list
 * added to exports after this file was made is simply absent, and treated as empty.
 */
export function parseTernExport(text: string): ParsedExport {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: NOT_TERN };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, message: NOT_TERN };
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.exportedAt !== 'string') return { ok: false, message: NOT_TERN };
  if (r.weightUnit !== 'lb') {
    return { ok: false, message: "This export's weights are in a unit Tern can't read." };
  }
  const lists = Object.fromEntries(
    EXPORT_LISTS.map((key) => [key, r[key] ?? []]),
  );
  if (Object.values(lists).some((list) => !Array.isArray(list))) {
    return { ok: false, message: NOT_TERN };
  }
  return {
    ok: true,
    copy: {
      exportedAt: r.exportedAt,
      weightUnit: 'lb',
      settings: r.settings ?? null,
      ...(lists as Pick<TernExport, (typeof EXPORT_LISTS)[number]>),
    },
  };
}

/** "tern-export-2026-10-20.json", dated by the local day it was made. */
export function exportFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `tern-export-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
