import React, { useCallback, useMemo, useRef, useState } from 'react';

import type { Dose, MedicationRepository } from './medication.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { addDays, parseDayKey } from '@shared/utils/date';
import { useSettings } from '../settings/SettingsContext';
import { useAward } from '../waypoints/hooks/useAward';
import { WaypointSource } from '../waypoints/models/waypoint';
import { dueMeds, takenMeds, trackedOn } from './models/schedule';
import { type Medication } from '../settings/models/medication';

type MedicationContextValue = {
  /** False until the doses have loaded once. */
  ready: boolean;
  /** Reads everything again from storage (pull to refresh). */
  reload: () => Promise<unknown>;
  medications: Medication[];
  /** Ids of the medications taken today (the real today, whatever day is viewed). */
  takenToday: ReadonlySet<string>;
  /** Scheduled on the viewed day (today unless a past day is picked; see `useViewedDay`) and not yet taken, earliest due first. */
  due: Medication[];
  /** Taken on the viewed day, earliest due first. */
  taken: Medication[];
  /** Marks a medication taken (or, with `false`, not taken) on the viewed day. Ignored if the day can't be edited. */
  setTaken: (medicationId: string, taken: boolean) => void;
  /** Stops tracking a medication and forgets its doses. */
  removeMedication: (medicationId: string) => void;
};

const [MedicationContext, useMedication] =
  createRequiredContext<MedicationContextValue>(
    'useMedication',
    'MedicationProvider',
  );
export { useMedication };

/** 1 = Sunday … 7 = Saturday, like the reminder weekdays. */
const weekdayOf = (day: string) => parseDayKey(day).getDay() + 1;

const sameDose = (a: Dose, b: Dose) =>
  a.medicationId === b.medicationId && a.day === b.day;

/** Inside SettingsProvider. */
export function MedicationProvider({
  repo,
  children,
}: {
  repo: MedicationRepository;
  children: React.ReactNode;
}) {
  const { settings, updateSettings } = useSettings();
  const today = useDayKey();
  const { day, editable } = useViewedDay();
  const medications = settings.medications;

  // From the viewed day through today, so today's doses (reminders, the waypoint) are
  // always at hand while a past day is shown. `from` is where the doses held start.
  const [loaded, setLoaded] = useState<{ from: string; doses: Dose[] }>({
    from: today,
    doses: [],
  });
  const doses = loaded.doses;
  const setDoses = useCallback(
    (change: (prev: Dose[]) => Dose[]) =>
      setLoaded((prev) => {
        const next = change(prev.doses);
        return next === prev.doses ? prev : { ...prev, doses: next };
      }),
    [],
  );
  // A read that finishes after the person has picked another day is dropped, so an older,
  // narrower read can't replace the doses the viewed day needs.
  const viewing = useRef(day);
  viewing.current = day;
  const { ready, reload } = useLoader(
    useCallback(
      async () => ({ from: day, doses: await repo.load(day, today) }),
      [repo, day, today],
    ),
    (read) => {
      if (read.from === viewing.current) setLoaded(read);
    },
    'Could not load medication doses',
  );
  // Until the viewed day's doses are in, it shows nothing rather than every medication as due.
  const covered = loaded.from <= day;
  const persist = usePersist(reload);

  const setTaken = useCallback(
    (medicationId: string, taken: boolean) => {
      if (!editable) return;
      const dose = { medicationId, day };
      setDoses((prev) => {
        if (prev.some((d) => sameDose(d, dose)) === taken) return prev;
        return taken ? [...prev, dose] : prev.filter((d) => !sameDose(d, dose));
      });
      persist(
        taken ? repo.take(medicationId, day) : repo.untake(medicationId, day),
        {
          log: 'Could not save medication dose',
          toast: "Couldn't save that — please try again.",
        },
      );
    },
    [repo, day, editable, persist, setDoses],
  );

  const removeMedication = useCallback(
    (medicationId: string) => {
      updateSettings({
        medications: medications.filter((m) => m.id !== medicationId),
      });
      setDoses((prev) => prev.filter((d) => d.medicationId !== medicationId));
      repo
        .forget(medicationId)
        .catch((e) => console.warn('Could not forget doses', e));
    },
    [repo, medications, updateSettings, setDoses],
  );

  // Only medications that still exist count as taken.
  const takenOn = useCallback(
    (on: string): ReadonlySet<string> =>
      new Set(
        doses
          .filter(
            (d) =>
              d.day === on && medications.some((m) => m.id === d.medicationId),
          )
          .map((d) => d.medicationId),
      ),
    [doses, medications],
  );
  const takenToday = useMemo(() => takenOn(today), [takenOn, today]);
  const takenOnDay = useMemo(() => takenOn(day), [takenOn, day]);

  const due = useMemo(
    () =>
      covered
        ? dueMeds(
            // One added after the viewed day wasn't due then.
            medications.filter((m) => trackedOn(m, day)),
            takenOnDay,
            weekdayOf(day),
          )
        : [],
    [covered, medications, takenOnDay, day],
  );
  const taken = useMemo(
    () => (covered ? takenMeds(medications, takenOnDay) : []),
    [covered, medications, takenOnDay],
  );

  // Everything due that day taken earns the waypoint. Yesterday's doses are only loaded while
  // yesterday is viewed, so it's judged then.
  const dueToday = useMemo(
    () => dueMeds(medications, takenToday, weekdayOf(today)),
    [medications, takenToday, today],
  );
  useAward(
    WaypointSource.Medication,
    takenToday.size > 0 && dueToday.length === 0,
    ready && medications.length > 0,
  );
  const yesterday = addDays(today, -1);
  const takenYesterday = useMemo(
    () => takenOn(yesterday),
    [takenOn, yesterday],
  );
  const dueYesterday = useMemo(
    () =>
      dueMeds(
        medications.filter((m) => trackedOn(m, yesterday)),
        takenYesterday,
        weekdayOf(yesterday),
      ),
    [medications, takenYesterday, yesterday],
  );
  useAward(
    WaypointSource.Medication,
    takenYesterday.size > 0 && dueYesterday.length === 0,
    ready && medications.length > 0 && loaded.from <= yesterday,
    { day: yesterday },
  );

  const value = useMemo<MedicationContextValue>(
    () => ({
      ready,
      reload,
      medications,
      takenToday,
      due,
      taken,
      setTaken,
      removeMedication,
    }),
    [
      ready,
      reload,
      medications,
      takenToday,
      due,
      taken,
      setTaken,
      removeMedication,
    ],
  );

  return (
    <MedicationContext.Provider value={value}>
      {children}
    </MedicationContext.Provider>
  );
}
