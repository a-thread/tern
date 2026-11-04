import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import { ViewedDayProvider } from '@shared/state/ViewedDayContext';
import { DayState } from '@shared/models/dayState';
import { addDays, dayKey } from '@shared/utils/date';
import { createMemorySettingsRepository } from '@/domain/settings/settings.repository';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { initialSettings } from '@/domain/settings/models/appSettings';
import { createMemoryDayNotesRepository } from '@/domain/day-notes/dayNotes.repository';
import { DayNotesProvider } from '@/domain/day-notes/DayNotesContext';
import { StepBars, type DayBar } from './StepBars';

const today = dayKey();
const bar = (day?: string): DayBar => ({
  label: '',
  value: 100,
  state: DayState.Partial,
  day,
});

async function show(days: DayBar[], trackNotes = true) {
  const repo = createMemoryDayNotesRepository();
  await repo.save({ day: addDays(today, -1), text: 'Joint pain' });
  const settings = createMemorySettingsRepository();
  await settings.save({ ...initialSettings, trackNotes });
  return render(
    <ToastProvider>
      <SettingsProvider repo={settings}>
        <ViewedDayProvider>
          <DayNotesProvider repo={repo}>
            <StepBars days={days} showLegend={false} />
          </DayNotesProvider>
        </ViewedDayProvider>
      </SettingsProvider>
    </ToastProvider>,
  );
}

describe('StepBars note marks', () => {
  it('marks a day with a note, and says so in the legend', async () => {
    const ui = await show([bar(addDays(today, -1)), bar(today)]);
    await waitFor(() => expect(ui.getByText('note')).toBeTruthy());
  });

  it('marks nothing on weekly bars, or while notes are off', async () => {
    const weekly = await show([bar(), bar()]);
    await waitFor(() => expect(weekly.queryByText('note')).toBeNull());
    const off = await show([bar(addDays(today, -1))], false);
    await waitFor(() => expect(off.queryByText('note')).toBeNull());
  });
});
