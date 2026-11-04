import React, { useEffect } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import {
  ViewedDayProvider,
  useViewedDay,
} from '@shared/state/ViewedDayContext';
import { addDays, dayKey } from '@shared/utils/date';
import { createMemorySettingsRepository } from '@/domain/settings/settings.repository';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { initialSettings } from '@/domain/settings/models/appSettings';
import { createMemoryDayNotesRepository } from '@/domain/day-notes/dayNotes.repository';
import {
  DayNotesProvider,
  useDayNotes,
} from '@/domain/day-notes/DayNotesContext';
import { DayNoteCard } from './DayNoteCard';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const today = dayKey();

/** Picks `day` in the viewed-day state, as tapping it in the week strip would. */
function ViewDay({ day }: { day: string }) {
  const viewed = useViewedDay();
  // Read so this renders again once notes load: by then the provider's own first effect,
  // which puts the day back to today, has run.
  const { ready } = useDayNotes();
  useEffect(() => {
    if (ready && viewed.day !== day) viewed.setDay(day);
  });
  return null;
}

async function show({
  notes = [] as { day: string; text: string }[],
  day = today,
  trackNotes = true,
} = {}) {
  const repo = createMemoryDayNotesRepository();
  for (const n of notes) await repo.save(n);
  const settings = createMemorySettingsRepository();
  await settings.save({ ...initialSettings, trackNotes });
  return render(
    <ToastProvider>
      <SettingsProvider repo={settings}>
        <ViewedDayProvider>
          <DayNotesProvider repo={repo}>
            <ViewDay day={day} />
            <DayNoteCard />
          </DayNotesProvider>
        </ViewedDayProvider>
      </SettingsProvider>
    </ToastProvider>,
  );
}

beforeEach(() => mockNavigate.mockClear());

describe('DayNoteCard', () => {
  it('asks about today, and opens the note', async () => {
    const ui = await show();
    await waitFor(() => expect(ui.getByText('Add a note')).toBeTruthy());
    expect(ui.getByText('How is your body today?')).toBeTruthy();
    fireEvent.press(ui.getByText('Add a note'));
    expect(mockNavigate).toHaveBeenCalledWith('DayNote');
  });

  it("shows today's note", async () => {
    const ui = await show({ notes: [{ day: today, text: 'Joint pain' }] });
    await waitFor(() => expect(ui.getByText('Joint pain')).toBeTruthy());
  });

  it('shows an older day read-only, and nothing when it has no note', async () => {
    const old = addDays(today, -4);
    const ui = await show({ day: old, notes: [{ day: old, text: 'Headache' }] });
    await waitFor(() => expect(ui.getByText('Headache')).toBeTruthy());
    fireEvent.press(ui.getByText('Headache'));
    expect(mockNavigate).not.toHaveBeenCalled();

    const empty = await show({ day: addDays(today, -5) });
    await waitFor(() => expect(empty.queryByText('Add a note')).toBeNull());
    expect(empty.queryByText('Notes')).toBeNull();
  });

  it('is gone while notes are switched off', async () => {
    const ui = await show({
      trackNotes: false,
      notes: [{ day: today, text: 'Joint pain' }],
    });
    await waitFor(() => expect(ui.queryByText('Joint pain')).toBeNull());
    expect(ui.queryByText('Add a note')).toBeNull();
  });
});
