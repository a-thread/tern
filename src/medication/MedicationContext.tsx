import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useBackend } from '@shared/state/BackendContext';
import { useToast } from '@shared/state/ToastContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useSettings } from '@settings/SettingsContext';
import { dueMeds, takenMeds, type Medication } from './medications';

type MedicationContextValue = {
  /** False until today's doses have loaded once. */
  ready: boolean;
  medications: Medication[];
  /** Ids of the medications taken today. */
  takenToday: ReadonlySet<string>;
  /** Not yet taken today, earliest due first. */
  due: Medication[];
  /** Taken today, earliest due first. */
  taken: Medication[];
  /** Marks a medication taken (or, with `false`, not taken) today. */
  setTaken: (medicationId: string, taken: boolean) => void;
  /** Stops tracking a medication and forgets its doses. */
  removeMedication: (medicationId: string) => void;
};

const MedicationContext = createContext<MedicationContextValue | null>(null);

/** Today's doses, next to the medications in settings. Must sit inside SettingsProvider. */
export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const { medication: repo } = useBackend();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const today = useDayKey();
  const medications = settings.medications;

  const [takenIds, setTakenIds] = useState<ReadonlySet<string>>(new Set());
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const doses = await repo.load(today, today);
      if (mounted.current) setTakenIds(new Set(doses.map((d) => d.medicationId)));
    } catch (e) {
      console.warn('Could not load medication doses', e);
    }
  }, [repo, today]);

  useEffect(() => {
    mounted.current = true;
    reload().finally(() => mounted.current && setReady(true));
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const setTaken = useCallback(
    (medicationId: string, taken: boolean) => {
      setTakenIds((prev) => {
        if (prev.has(medicationId) === taken) return prev;
        const next = new Set(prev);
        if (taken) next.add(medicationId);
        else next.delete(medicationId);
        return next;
      });
      (taken ? repo.take(medicationId, today) : repo.untake(medicationId, today)).catch((e) => {
        console.warn('Could not save medication dose', e);
        toast.show("Couldn't save that — please try again.");
        reload();
      });
    },
    [repo, today, toast, reload],
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
  const due = useMemo(() => dueMeds(medications, takenToday), [medications, takenToday]);
  const taken = useMemo(() => takenMeds(medications, takenToday), [medications, takenToday]);

  const value = useMemo<MedicationContextValue>(
    () => ({ ready, medications, takenToday, due, taken, setTaken, removeMedication }),
    [ready, medications, takenToday, due, taken, setTaken, removeMedication],
  );

  return <MedicationContext.Provider value={value}>{children}</MedicationContext.Provider>;
}

export function useMedication() {
  const ctx = useContext(MedicationContext);
  if (!ctx) throw new Error('useMedication must be used within MedicationProvider');
  return ctx;
}
