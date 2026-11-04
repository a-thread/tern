import React, { useEffect } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import {
  ViewedDayProvider,
  useViewedDay,
} from '@shared/state/ViewedDayContext';
import { confirm } from '@shared/utils/confirm';
import { addDays, dayKey } from '@shared/utils/date';
import { createMemorySettingsRepository } from '@/domain/settings/settings.repository';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { createMemoryDayNotesRepository } from '@/domain/day-notes/dayNotes.repository';
import {
  DayNotesProvider,
  useDayNotes,
} from '@/domain/day-notes/DayNotesContext';
import DayNoteScreen from './DayNoteScreen';

jest.mock('@shared/utils/confirm', () => ({ confirm: jest.fn() }));

const today = dayKey();
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/**
 * Shows `children` once notes have loaded and `day` is the viewed day, as LoadGate and the
 * week strip would in the app. The screen reads its starting text on first render.
 */
function OnDay({ day, children }: { day: string; children: React.ReactNode }) {
  const viewed = useViewedDay();
  const { ready } = useDayNotes();
  // Every render: the provider's own first effect puts the day back to today.
  useEffect(() => {
    if (viewed.day !== day) viewed.setDay(day);
  });
  return ready && viewed.day === day ? <>{children}</> : null;
}

async function show({
  notes = [] as { day: string; text: string }[],
  day = today,
} = {}) {
  const repo = createMemoryDayNotesRepository();
  for (const n of notes) await repo.save(n);
  const goBack = jest.fn();
  const navigation = { goBack } as unknown as React.ComponentProps<
    typeof DayNoteScreen
  >['navigation'];
  const route = { key: 'DayNote', name: 'DayNote' } as React.ComponentProps<
    typeof DayNoteScreen
  >['route'];
  const ui = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={createMemorySettingsRepository()}>
          <ViewedDayProvider>
            <DayNotesProvider repo={repo}>
              <OnDay day={day}>
                <DayNoteScreen navigation={navigation} route={route} />
              </OnDay>
            </DayNotesProvider>
          </ViewedDayProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
  return { ui, repo, goBack };
}

beforeEach(() => jest.mocked(confirm).mockClear());

describe('DayNoteScreen', () => {
  it('saves the note and closes', async () => {
    const { ui, repo, goBack } = await show();
    const field = await waitFor(() =>
      ui.getByLabelText('Note about your day'),
    );
    fireEvent.changeText(field, 'Low energy, took ibuprofen');
    fireEvent.press(ui.getByText('Save'));
    expect(goBack).toHaveBeenCalled();
    await waitFor(async () =>
      expect(await repo.load(today, today)).toEqual([
        { day: today, text: 'Low energy, took ibuprofen' },
      ]),
    );
  });

  it('asks before an emptied note is saved away', async () => {
    const { ui, repo, goBack } = await show({
      notes: [{ day: today, text: 'Joint pain' }],
    });
    const field = await waitFor(() =>
      ui.getByDisplayValue('Joint pain'),
    );
    fireEvent.changeText(field, '   ');
    fireEvent.press(ui.getByText('Save'));
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'Remove' }),
    );
    expect(goBack).not.toHaveBeenCalled();
    expect(await repo.load(today, today)).toHaveLength(1);
  });

  it("says why a closed day can't be saved, and keeps the text", async () => {
    const old = addDays(today, -3);
    const { ui, goBack } = await show({
      day: old,
      notes: [{ day: old, text: 'Headache' }],
    });
    await waitFor(() =>
      expect(ui.getByText(/can no longer be changed/)).toBeTruthy(),
    );
    fireEvent.press(ui.getByText('Save'));
    expect(goBack).not.toHaveBeenCalled();
    expect(ui.getByDisplayValue('Headache')).toBeTruthy();
    expect(ui.queryByText(/Remove .* note/)).toBeNull();
  });
});
