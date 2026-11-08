import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

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

async function show(
  days: DayBar[],
  trackNotes = true,
  formatValue?: (bar: DayBar) => string,
) {
  const repo = createMemoryDayNotesRepository();
  await repo.save({ day: addDays(today, -1), text: 'Joint pain' });
  const settings = createMemorySettingsRepository();
  await settings.save({ ...initialSettings, trackNotes });
  return render(
    <ToastProvider>
      <SettingsProvider repo={settings}>
        <ViewedDayProvider>
          <DayNotesProvider repo={repo}>
            <StepBars
              days={days}
              showLegend={false}
              formatValue={formatValue}
            />
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

describe('StepBars taps', () => {
  const steps = (b: DayBar) => `${b.value} steps`;

  it('names a tapped day over the chart, moves with the next tap, and clears on a second tap', async () => {
    const ui = await show([bar('2026-08-01'), bar('2026-08-02')], false, steps);
    await waitFor(() => expect(ui.getAllByRole('button')).toHaveLength(2));
    expect(ui.queryByText(/steps$/)).toBeNull();

    fireEvent.press(ui.getByLabelText('Aug 1 · 100 steps'));
    expect(ui.getByText('Aug 1 · 100 steps')).toBeTruthy();

    fireEvent.press(ui.getByLabelText('Aug 2 · 100 steps'));
    expect(ui.queryByText('Aug 1 · 100 steps')).toBeNull();
    expect(ui.getByText('Aug 2 · 100 steps')).toBeTruthy();

    fireEvent.press(ui.getByLabelText('Aug 2 · 100 steps'));
    expect(ui.queryByText(/steps$/)).toBeNull();
  });

  it('names a weekly bar by the week it covers', async () => {
    const ui = await show(
      [{ ...bar(), week: { from: '2026-07-27', to: '2026-08-02' } }],
      false,
    );
    fireEvent.press(await ui.findByLabelText('Jul 27 – Aug 2'));
    expect(ui.getByText('Jul 27 – Aug 2')).toBeTruthy();
  });

  it('leaves a bar with no date untappable', async () => {
    const ui = await show([bar()], false);
    await waitFor(() => expect(ui.queryAllByRole('button')).toHaveLength(0));
  });
});

describe('StepBars legend and labels', () => {
  async function chart(props: Partial<React.ComponentProps<typeof StepBars>>) {
    const settings = createMemorySettingsRepository();
    await settings.save({ ...initialSettings, trackNotes: false });
    return render(
      <ToastProvider>
        <SettingsProvider repo={settings}>
          <ViewedDayProvider>
            <DayNotesProvider repo={createMemoryDayNotesRepository()}>
              <StepBars days={[]} {...props} />
            </DayNotesProvider>
          </ViewedDayProvider>
        </SettingsProvider>
      </ToastProvider>,
    );
  }
  const days = [bar('2026-10-09'), bar('2026-10-10'), bar('2026-11-07')];

  it('names the goal line in the legend, even with the day key hidden', async () => {
    const ui = await chart({ days, goal: 8000, showLegend: false });
    await waitFor(() => expect(ui.getByText('goal')).toBeTruthy());
    expect(ui.queryByText('goal met')).toBeNull();
  });

  it('keys goal met, partial and rest, and a freeze only when one shows', async () => {
    const ui = await chart({ days });
    await waitFor(() => expect(ui.getByText('goal met')).toBeTruthy());
    expect(ui.getByText('partial')).toBeTruthy();
    expect(ui.getByText('rest')).toBeTruthy();
    expect(ui.queryByText('freeze')).toBeNull();

    const frozen = await chart({
      days: [...days, { ...bar('2026-11-08'), state: DayState.Frozen }],
    });
    await waitFor(() => expect(frozen.getByText('freeze')).toBeTruthy());
  });

  it('shows the first and last dates when there is no label under each bar', async () => {
    const ui = await chart({ days, showLabels: false });
    await waitFor(() => expect(ui.getByText('Oct 9')).toBeTruthy());
    expect(ui.getByText('Nov 7')).toBeTruthy();
  });

  it('fades the other bars while one is picked', async () => {
    const ui = await chart({ days });
    const faded = () =>
      (JSON.stringify(ui.toJSON()).match(/"opacity":0.4/g) ?? []).length;
    expect(faded()).toBe(0);
    fireEvent.press(await ui.findByLabelText('Oct 10'));
    expect(faded()).toBe(days.length - 1);
  });
});
