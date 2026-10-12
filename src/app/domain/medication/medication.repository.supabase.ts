import type { TernClient } from '../../shared/backend/supabase';
import { ok, rows } from '../../shared/backend/query';
import type { MedicationRepository } from './medication.repository';

export function createSupabaseMedicationRepository(
  db: TernClient,
): MedicationRepository {
  return {
    async load(from, to) {
      return (
        await rows<{ medication_id: string; day: string }>(
          db
            .from('medication_doses')
            .select('medication_id, day')
            .gte('day', from)
            .lte('day', to),
        )
      ).map((r) => ({
        medicationId: r.medication_id,
        day: r.day,
      }));
    },
    async take(medicationId, day) {
      await ok(
        db
          .from('medication_doses')
          .upsert(
            { medication_id: medicationId, day },
            { onConflict: 'user_id,medication_id,day', ignoreDuplicates: true },
          ),
      );
    },
    async untake(medicationId, day) {
      await ok(
        db
          .from('medication_doses')
          .delete()
          .eq('medication_id', medicationId)
          .eq('day', day),
      );
    },
    async forget(medicationId) {
      await ok(
        db.from('medication_doses').delete().eq('medication_id', medicationId),
      );
    },
  };
}
