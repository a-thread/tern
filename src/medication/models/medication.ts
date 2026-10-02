import { cleanSpaces, sameName } from '@shared/utils/text';

/** A medication the user chose to track. Stored in settings; doses are stored separately. */
export type Medication = {
  id: string;
  name: string;
  /** Minutes since local midnight when it is due. */
  at: number;
  /** Every day, or once a week on `weekday`. */
  frequency: MedicationFrequency;
  /** 1 = Sunday … 7 = Saturday. Only used when weekly. */
  weekday: number;
  /** A reminder at `at` (on `weekday` when weekly). */
  remind: boolean;
};

export type MedicationFrequency = 'daily' | 'weekly';

/** How many medications can be tracked, and what a new one starts with. */
export class MedicationLimits {
  static readonly MAX_COUNT = 10;

  static readonly MAX_NAME_LENGTH = 40;

  static readonly DEFAULT_TIME = 8 * 60;
}

/** Trimmed, with runs of spaces collapsed. */
export const cleanMedName = cleanSpaces;

/** Why `name` can't be used for a medication, or null when it can. `selfId` is the one being renamed. */
export function validateMedName(
  name: string,
  existing: readonly Medication[],
  selfId?: string,
): string | null {
  const clean = cleanMedName(name);
  if (!clean) return 'Give the medication a name.';
  if (clean.length > MedicationLimits.MAX_NAME_LENGTH) return `Keep the name under ${MedicationLimits.MAX_NAME_LENGTH} characters.`;
  if (existing.some((m) => m.id !== selfId && sameName(m.name, clean))) {
    return 'You already track a medication with that name.';
  }
  return null;
}

export function newMedication(name: string, id: string): Medication {
  return {
    id,
    name: cleanMedName(name),
    at: MedicationLimits.DEFAULT_TIME,
    frequency: 'daily',
    weekday: 1,
    remind: false,
  };
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
        name: cleanMedName(m.name).slice(0, MedicationLimits.MAX_NAME_LENGTH),
        at:
          typeof m.at === 'number' && Number.isFinite(m.at) && m.at >= 0 && m.at < 1440
            ? Math.floor(m.at)
            : MedicationLimits.DEFAULT_TIME,
        frequency: m.frequency === 'weekly' ? 'weekly' : 'daily',
        weekday:
          Number.isInteger(m.weekday) && m.weekday >= 1 && m.weekday <= 7 ? m.weekday : 1,
        remind: m.remind === true,
      });
    }
  }
  return out.slice(0, MedicationLimits.MAX_COUNT);
}