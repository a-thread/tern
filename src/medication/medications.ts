/** A medication the user chose to track. Stored in settings; doses are stored separately. */
export type Medication = {
  id: string;
  name: string;
  /** Minutes since local midnight when it is due. */
  at: number;
  /** A daily reminder at `at`. */
  remind: boolean;
};

export const MAX_MEDICATIONS = 10;
export const MAX_MED_NAME = 40;
export const DEFAULT_MED_TIME = 8 * 60;

/** Trimmed, with runs of spaces collapsed. */
export function cleanMedName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

const sameName = (a: string, b: string) =>
  cleanMedName(a).toLowerCase() === cleanMedName(b).toLowerCase();

/** Why `name` can't be used for a medication, or null when it can. `selfId` is the one being renamed. */
export function validateMedName(
  name: string,
  existing: readonly Medication[],
  selfId?: string,
): string | null {
  const clean = cleanMedName(name);
  if (!clean) return 'Give the medication a name.';
  if (clean.length > MAX_MED_NAME) return `Keep the name under ${MAX_MED_NAME} characters.`;
  if (existing.some((m) => m.id !== selfId && sameName(m.name, clean))) {
    return 'You already track a medication with that name.';
  }
  return null;
}

export function newMedication(name: string, id: string): Medication {
  return { id, name: cleanMedName(name), at: DEFAULT_MED_TIME, remind: false };
}

/** Medications not yet taken today, earliest due first. */
export function dueMeds(
  meds: readonly Medication[],
  takenToday: ReadonlySet<string>,
): Medication[] {
  return meds
    .filter((m) => !takenToday.has(m.id))
    .sort((a, b) => a.at - b.at || a.name.localeCompare(b.name));
}

/** Medications taken today, earliest due first. */
export function takenMeds(
  meds: readonly Medication[],
  takenToday: ReadonlySet<string>,
): Medication[] {
  return meds
    .filter((m) => takenToday.has(m.id))
    .sort((a, b) => a.at - b.at || a.name.localeCompare(b.name));
}

/** Saved settings can hold anything; keep only well-formed medications. */
export function mergeMedications(saved: unknown): Medication[] {
  if (!Array.isArray(saved)) return [];
  const out: Medication[] = [];
  for (const m of saved) {
    if (
      m &&
      typeof m.id === 'string' &&
      m.id &&
      typeof m.name === 'string' &&
      cleanMedName(m.name) &&
      !out.some((o) => o.id === m.id)
    ) {
      out.push({
        id: m.id,
        name: cleanMedName(m.name).slice(0, MAX_MED_NAME),
        at:
          typeof m.at === 'number' && Number.isFinite(m.at) && m.at >= 0 && m.at < 1440
            ? Math.floor(m.at)
            : DEFAULT_MED_TIME,
        remind: m.remind === true,
      });
    }
  }
  return out.slice(0, MAX_MEDICATIONS);
}
