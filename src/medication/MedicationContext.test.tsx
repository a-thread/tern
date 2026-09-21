import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '@shared/state/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey, parseDayKey } from '@shared/utils/date';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { MedicationProvider, useMedication } from './MedicationContext';
import { newMedication } from './medications';

const today = dayKey();
const vitaminD = newMedication('Vitamin D', 'med-d');
const iron = newMedication('Iron', 'med-iron');

async function setup(backend: Backend = createMemoryBackend()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={backend}>
      <ToastProvider>
        <SettingsProvider>
          <MedicationProvider>{children}</MedicationProvider>
        </SettingsProvider>
      </ToastProvider>
    </BackendProvider>
  );
  const hook = renderHook(() => ({ meds: useMedication(), settings: useSettings() }), { wrapper });
  await waitFor(() => {
    expect(hook.result.current.meds.ready).toBe(true);
    expect(hook.result.current.settings.ready).toBe(true);
  });
  return { ...hook, backend };
}

const track = async (
  result: { current: { settings: ReturnType<typeof useSettings> } },
  ...meds: (typeof vitaminD)[]
) =>
  act(async () => {
    result.current.settings.updateSettings({ medications: meds });
  });

const weekdayToday = parseDayKey(today).getDay() + 1; // 1 = Sunday … 7 = Saturday
const otherWeekday = (weekdayToday % 7) + 1;

describe('MedicationProvider', () => {
  it('a weekly medication is due only on its weekday', async () => {
    const { result } = await setup();
    const onToday = { ...newMedication('Weekly today', 'w1'), frequency: 'weekly' as const, weekday: weekdayToday };
    const another = { ...newMedication('Weekly other', 'w2'), frequency: 'weekly' as const, weekday: otherWeekday };
    await track(result, onToday, another, vitaminD);
    expect(result.current.meds.due.map((m) => m.id).sort()).toEqual(['med-d', 'w1']);
    expect(result.current.meds.medications).toHaveLength(3);
  });

  it('has nothing to show until a medication is added', async () => {
    const { result } = await setup();
    expect(result.current.meds.medications).toEqual([]);
    expect(result.current.meds.due).toEqual([]);
    expect(result.current.meds.taken).toEqual([]);
  });

  it('lists a new medication as due, then taken once marked, and stores the dose', async () => {
    const { result, backend } = await setup();
    await track(result, vitaminD, iron);
    // Both are due at the default time, so they fall back to alphabetical order.
    expect(result.current.meds.due.map((m) => m.id)).toEqual(['med-iron', 'med-d']);

    await act(async () => {
      result.current.meds.setTaken('med-d', true);
    });
    expect(result.current.meds.due.map((m) => m.id)).toEqual(['med-iron']);
    expect(result.current.meds.taken.map((m) => m.id)).toEqual(['med-d']);
    expect(await backend.medication.load(today, today)).toEqual([{ medicationId: 'med-d', day: today }]);
  });

  it('marking taken again is harmless, and undoing puts it back to due', async () => {
    const { result, backend } = await setup();
    await track(result, vitaminD);
    await act(async () => {
      result.current.meds.setTaken('med-d', true);
      result.current.meds.setTaken('med-d', true);
    });
    expect(await backend.medication.load(today, today)).toHaveLength(1);

    await act(async () => {
      result.current.meds.setTaken('med-d', false);
    });
    expect(result.current.meds.due.map((m) => m.id)).toEqual(['med-d']);
    expect(await backend.medication.load(today, today)).toEqual([]);
  });

  it("picks up today's saved doses on load", async () => {
    const backend = createMemoryBackend();
    await backend.medication.take('med-d', today);
    await backend.medication.take('med-d', '2000-01-01'); // another day: ignored
    const { result } = await setup(backend);
    await track(result, vitaminD);
    expect(result.current.meds.taken.map((m) => m.id)).toEqual(['med-d']);
  });

  it('ignores doses of a medication that no longer exists', async () => {
    const backend = createMemoryBackend();
    await backend.medication.take('deleted-med', today);
    const { result } = await setup(backend);
    await track(result, vitaminD);
    expect(result.current.meds.taken).toEqual([]);
    expect(result.current.meds.due.map((m) => m.id)).toEqual(['med-d']);
  });

  it('removing a medication drops it from settings and forgets its doses', async () => {
    const { result, backend } = await setup();
    await track(result, vitaminD, iron);
    await act(async () => {
      result.current.meds.setTaken('med-d', true);
    });
    await act(async () => {
      result.current.meds.removeMedication('med-d');
    });
    expect(result.current.settings.settings.medications.map((m) => m.id)).toEqual(['med-iron']);
    await waitFor(async () => expect(await backend.medication.load(today, today)).toEqual([]));
  });

  it('reverts the mark and tells the person when saving fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const backend = createMemoryBackend();
    backend.medication.take = async () => {
      throw new Error('offline');
    };
    const { result } = await setup(backend);
    await track(result, vitaminD);

    await act(async () => {
      result.current.meds.setTaken('med-d', true);
    });
    // Optimistic at first, then rolled back to what the database really has.
    await waitFor(() => expect(result.current.meds.taken).toEqual([]));
    expect(result.current.meds.due.map((m) => m.id)).toEqual(['med-d']);
    warn.mockRestore();
  });
});
