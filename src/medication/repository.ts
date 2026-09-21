/** A medication marked as taken on a day (YYYY-MM-DD). */
export type Dose = { medicationId: string; day: string };

/** Which medications were taken on which days. Marking a dose twice is harmless. */
export interface MedicationRepository {
  /** Doses from `from` to `to` inclusive. */
  load(from: string, to: string): Promise<Dose[]>;
  take(medicationId: string, day: string): Promise<void>;
  untake(medicationId: string, day: string): Promise<void>;
  /** Forgets every dose of a medication that was deleted. */
  forget(medicationId: string): Promise<void>;
}

export function createMemoryMedicationRepository(): MedicationRepository {
  let doses: Dose[] = [];
  const same = (a: Dose, b: Dose) => a.medicationId === b.medicationId && a.day === b.day;
  return {
    load: async (from, to) => doses.filter((d) => d.day >= from && d.day <= to),
    take: async (medicationId, day) => {
      const dose = { medicationId, day };
      if (!doses.some((d) => same(d, dose))) doses = [...doses, dose];
    },
    untake: async (medicationId, day) => {
      doses = doses.filter((d) => !same(d, { medicationId, day }));
    },
    forget: async (medicationId) => {
      doses = doses.filter((d) => d.medicationId !== medicationId);
    },
  };
}
