import type { TernClient } from '@shared/backend/supabase';
import { ok, rows } from '@shared/backend/query';
import type { HealthConsentRecord } from './models/healthConsent';
import type { ConsentRepository } from './consent.repository';

type ConsentRow = { policy_version: string; consented_at: string };

const toRecord = (row: ConsentRow): HealthConsentRecord => ({
  policyVersion: row.policy_version,
  consentedAt: row.consented_at,
});

export function createSupabaseConsentRepository(
  db: TernClient,
): ConsentRepository {
  return {
    async get() {
      const [row] = await rows<ConsentRow>(
        db
          .from('health_consents')
          .select('policy_version, consented_at')
          .limit(1),
      );
      return row ? toRecord(row) : null;
    },
    async give(policyVersion) {
      const record = {
        policy_version: policyVersion,
        consented_at: new Date().toISOString(),
      };
      await ok(
        db.from('health_consents').upsert(record, { onConflict: 'user_id' }),
      );
      return toRecord(record);
    },
    async withdraw() {
      // RLS limits this to the caller's own row; the filter only satisfies PostgREST.
      await ok(db.from('health_consents').delete().not('user_id', 'is', null));
    },
  };
}
