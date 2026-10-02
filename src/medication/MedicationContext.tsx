import React, { useCallback, useMemo, useState } from 'react';

import { useBackend } from '@shared/state/BackendContext';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { parseDayKey } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { dueMeds, takenMeds, type Medication } from './models';

type MedicationContextValue = {
  /** False until today's doses have loaded once. */
  ready: boolean;
  medications: Medication[];
  /** Ids of the medications taken today. */
  takenToday: ReadonlySet<string>;
  /** Scheduled for today and not yet taken, earliest due first. */
  due: Medication[];
  /** Taken today, earliest due first. */
  taken: Medication[];
  /** Marks a medication taken (or, with `false`, not taken) today. */
  setTaken: (medicationId: string, taken: boolean) => void;
  /** Stops tracking a medication and forgets its doses. */
  removeMedication: (medicationId: string) => void;
};

const [MedicationContext, useMedication] = createRequiredContext<MedicationContextValue>(
  'useMedication',
  'MedicationProvider',
);
export { useMedication };

/** Today's doses, next to the medications in settings. Must sit inside SettingsProvider. */
export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const { medication: repo } = useBackend();
  const { settings, updateSettings } = useSettings();
  const today = useDayKey();
  const medications = settings.medications;

  const [takenIds, setTakenIds] = useState<ReadonlySet<string>>(new Set());
  const { ready, reload } = useLoader(
    useCallback(() => repo.load(today, today), [repo, today]),
    (doses) => setTakenIds(new Set(doses.map((d) => d.medicationId))),
    'Could not load medication doses',
  );
  const persist = usePersist(reload);

  const setTaken = useCallback(
    (medicationId: string, taken: boolean) => {
      setTakenIds((prev) => {
        if (prev.has(medicationId) === taken) return prev;
        const next = new Set(prev);
        if (taken) next.add(medicationId);
        else next.delete(medicationId);
        return next;
      });
      persist(taken ? repo.take(medicationId, today) : repo.untake(medicationId, today), {
        log: 'Could not save medication dose',
        toast: "Couldn't save that — please try again.",
      });
    },
    [repo, today, persist],
  );

  const removeMedication = useCallback(
    (medicationId: string) => {
      updateSettings({ medications: medications.filter((m) => m.id !== medicationId) });
      setTakenIds((prev) => {
        if (!prev.has(medicationId)) return prev;
        const next = new Set(prev);
        next.delete(medicationId);
        return next;
      });
      repo.forget(medicationId).catch((e) => console.warn('Could not forget doses', e));
    },
    [repo, medications, updateSettings],
  );

  // Only medications that still exist count as taken.
  const takenToday = useMemo(
    () => new Set([...takenIds].filter((id) => medications.some((m) => m.id === id))),
    [takenIds, medications],
  );
  // 1 = Sunday … 7 = Saturday, like the reminder weekdays.
  const weekday = parseDayKey(today).getDay() + 1;
  const due = useMemo(
    () => dueMeds(medications, takenToday, weekday),
    [medications, takenToday, weekday],
  );
  const taken = useMemo(() => takenMeds(medications, takenToday), [medications, takenToday]);

  const value = useMemo<MedicationContextValue>(
    () => ({ ready, medications, takenToday, due, taken, setTaken, removeMedication }),
    [ready, medications, takenToday, due, taken, setTaken, removeMedication],
  );

  return <MedicationContext.Provider value={value}>{children}</MedicationContext.Provider>;
}
