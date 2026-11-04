import React, { useCallback, useMemo } from 'react';

import type { DayNotesRepository } from './dayNotes.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useSyncedList } from '@shared/hooks/useSyncedList';
import { addDays } from '@shared/utils/date';
import { useSettings } from '../settings/SettingsContext';
import {
  cleanDayNote,
  notedDays,
  noteFor,
  type DayNote,
} from './models/dayNote';

/** How far back the context keeps notes: enough for the longest Trends range. */
const HISTORY_DAYS = 180;

type DayNotesContextValue = {
  /** False until notes have loaded once. */
  ready: boolean;
  /** Reads everything again from storage (pull to refresh). */
  reload: () => Promise<unknown>;
  /** Notes are switched on in Settings (they are by default). Off hides them; nothing is deleted. */
  enabled: boolean;
  /** The last 180 days of notes, oldest first. */
  notes: DayNote[];
  /** The days with a note, for marking charts; empty while notes are switched off. */
  noted: ReadonlySet<string>;
  /** The viewed day's note (today unless a past day is picked; see `useViewedDay`). */
  onDay: DayNote | undefined;
  /**
   * Saves the viewed day's note, replacing an earlier one; blank text removes it. False if
   * the day can't be edited (before yesterday).
   */
  save: (text: string) => boolean;
  /** Removes the viewed day's note. */
  clearDay: () => void;
};

const [DayNotesContext, useDayNotes] =
  createRequiredContext<DayNotesContextValue>('useDayNotes', 'DayNotesProvider');
export { useDayNotes };

/** A free-text note per day: how the body felt, what shaped the day. Must sit inside SettingsProvider. */
export function DayNotesProvider({
  repo,
  children,
}: {
  repo: DayNotesRepository;
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const today = useDayKey();
  const { day, editable } = useViewedDay();
  const enabled = settings.trackNotes;

  const { entries, ready, reload, change } = useSyncedList(
    useCallback(
      () => repo.load(addDays(today, -(HISTORY_DAYS - 1)), today),
      [repo, today],
    ),
    'Could not load notes',
  );

  const onDay = noteFor(entries, day);
  // Built once per change rather than by each chart that marks noted days.
  const noted = useMemo(
    () => (enabled ? notedDays(entries) : new Set<string>()),
    [enabled, entries],
  );

  const clearDay = useCallback(() => {
    if (!editable) return;
    change((prev) => prev.filter((n) => n.day !== day), repo.remove(day), {
      log: 'Could not remove note',
      toast: "Couldn't remove your note — please try again.",
    });
  }, [repo, day, editable, change]);

  const save = useCallback(
    (raw: string) => {
      if (!editable) return false;
      const text = cleanDayNote(raw);
      if (!text) {
        clearDay();
        return true;
      }
      const note: DayNote = { day, text };
      change(
        (prev) => [...prev.filter((n) => n.day !== day), note],
        repo.save(note),
        {
          log: 'Could not save note',
          toast: "Couldn't save your note — please try again.",
        },
      );
      return true;
    },
    [repo, day, editable, change, clearDay],
  );

  const value = useMemo<DayNotesContextValue>(
    () => ({
      ready,
      reload,
      enabled,
      notes: entries,
      noted,
      onDay,
      save,
      clearDay,
    }),
    [ready, reload, enabled, entries, noted, onDay, save, clearDay],
  );

  return (
    <DayNotesContext.Provider value={value}>{children}</DayNotesContext.Provider>
  );
}
