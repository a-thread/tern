import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { createMemorySettingsRepository } from '../settings/settings.repository';
import { SettingsProvider, useSettings } from '../settings/SettingsContext';
import { createMemoryDayNotesRepository } from './dayNotes.repository';
import { DayNotesProvider, useDayNotes } from './DayNotesContext';

const today = dayKey();

async function setup(repo = createMemoryDayNotesRepository()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <SettingsProvider repo={createMemorySettingsRepository()}>
        <DayNotesProvider repo={repo}>{children}</DayNotesProvider>
      </SettingsProvider>
    </ToastProvider>
  );
  const hook = renderHook(
    () => ({ notes: useDayNotes(), settings: useSettings() }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.notes.ready).toBe(true);
    expect(hook.result.current.settings.ready).toBe(true);
  });
  // Most cases only need the notes.
  const result = {
    get current() {
      return hook.result.current.notes;
    },
  };
  return { ...hook, result, settingsOf: hook.result, repo };
}

describe('DayNotesProvider', () => {
  it('starts on, with no note', async () => {
    const { result } = await setup();
    expect(result.current.enabled).toBe(true);
    expect(result.current.onDay).toBeUndefined();
    expect(result.current.notes).toEqual([]);
  });

  it('keeps notes while switched off, and has them back when switched on', async () => {
    const { result, settingsOf } = await setup();
    await act(async () => {
      result.current.save('Joint pain');
    });
    await act(async () => {
      settingsOf.current.settings.updateSettings({ trackNotes: false });
    });
    expect(result.current.enabled).toBe(false);
    expect(result.current.onDay?.text).toBe('Joint pain');
    await act(async () => {
      settingsOf.current.settings.updateSettings({ trackNotes: true });
    });
    expect(result.current.enabled).toBe(true);
    expect(result.current.onDay?.text).toBe('Joint pain');
  });

  it('saves a trimmed note, and writing again replaces it', async () => {
    const { result, repo } = await setup();
    await act(async () => {
      expect(result.current.save('  Low energy, joint pain ')).toBe(true);
    });
    expect(result.current.onDay).toEqual({
      day: today,
      text: 'Low energy, joint pain',
    });
    await act(async () => {
      result.current.save('Took ibuprofen');
    });
    expect(result.current.notes).toHaveLength(1);
    expect(await repo.load(today, today)).toEqual([
      { day: today, text: 'Took ibuprofen' },
    ]);
  });

  it('removes the note when saved blank, or cleared', async () => {
    const { result, repo } = await setup();
    await act(async () => {
      result.current.save('Headache');
    });
    await act(async () => {
      result.current.save('   ');
    });
    expect(result.current.onDay).toBeUndefined();
    await act(async () => {
      result.current.save('Headache');
    });
    await act(async () => {
      result.current.clearDay();
    });
    expect(result.current.onDay).toBeUndefined();
    expect(await repo.load(today, today)).toEqual([]);
  });
});
