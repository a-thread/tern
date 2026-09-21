import type { TernClient } from '@shared/backend/supabase';
import type { MedicationRepository } from './repository';

export function createSupabaseMedicationRepository(
  db: TernClient,
): MedicationRepository {
  return {
    async load(from, to) {
      const { data, error } = await db
        .from('medication_doses')
        .select('medication_id, day')
        .gte('day', from)
        .lte('day', to);
      if (error) throw error;
      return (data ?? []).map((r: { medication_id: string; day: string }) => ({
        medicationId: r.medication_id,
        day: r.day,
      }));
    },
    async take(medicationId, day) {
      const { error } = await db
        .from('medication_doses')
        .upsert(
          { medication_id: medicationId, day },
          { onConflict: 'user_id,medication_id,day', ignoreDuplicates: true },
        );
      if (error) throw error;
    },
    async untake(medicationId, day) {
      const { error } = await db
        .from('medication_doses')
        .delete()
        .eq('medication_id', medicationId)
        .eq('day', day);
      if (error) throw error;
    },
    async forget(medicationId) {
      const { error } = await db
        .from('medication_doses')
        .delete()
        .eq('medication_id', medicationId);
      if (error) throw error;
    },
  };
}
