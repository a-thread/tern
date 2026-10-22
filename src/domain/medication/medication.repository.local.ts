import type { LocalDb } from '@shared/backend/localDb';
import type { MedicationRepository } from './medication.repository';

export function createLocalMedicationRepository(
  db: LocalDb,
): MedicationRepository {
  return {
    async load(from, to) {
      return (
        await db.all<{ medication_id: string; day: string }>(
          'SELECT medication_id, day FROM medication_doses WHERE day BETWEEN ? AND ?',
          [from, to],
        )
      ).map((r) => ({ medicationId: r.medication_id, day: r.day }));
    },
    async take(medicationId, day) {
      await db.run(
        'INSERT OR IGNORE INTO medication_doses (medication_id, day) VALUES (?, ?)',
        [medicationId, day],
      );
    },
    async untake(medicationId, day) {
      await db.run(
        'DELETE FROM medication_doses WHERE medication_id = ? AND day = ?',
        [medicationId, day],
      );
    },
    async forget(medicationId) {
      await db.run('DELETE FROM medication_doses WHERE medication_id = ?', [
        medicationId,
      ]);
    },
  };
}
