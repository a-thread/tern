import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { BackendProvider, createMemoryBackend } from '@shared/state/BackendContext';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { useFoodDisplay } from './useFoodDisplay';

async function setup() {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={createMemoryBackend()}>
      <SettingsProvider>{children}</SettingsProvider>
    </BackendProvider>
  );
  const hook = renderHook(() => ({ display: useFoodDisplay(), settings: useSettings() }), { wrapper });
  await waitFor(() => expect(hook.result.current.settings.ready).toBe(true));
  return hook;
}

describe('useFoodDisplay showCalories', () => {
  it('shows calories when tracking is on and the display switch is on', async () => {
    const { result } = await setup();
    expect(result.current.display.showCalories).toBe(true);
  });

  it('hides them when the display switch is off', async () => {
    const { result } = await setup();
    act(() => result.current.settings.updateSettings({ showCalories: false }));
    expect(result.current.display.showCalories).toBe(false);
  });

  it('hides them whenever calorie tracking is off, whatever the display switch says', async () => {
    const { result } = await setup();
    expect(result.current.settings.settings.showCalories).toBe(true);
    act(() => result.current.settings.updateSettings({ trackCalories: false }));
    expect(result.current.settings.settings.showCalories).toBe(true); // the saved switch is untouched
    expect(result.current.display.showCalories).toBe(false);
  });

  it('brings them back when tracking is turned on again', async () => {
    const { result } = await setup();
    act(() => result.current.settings.updateSettings({ trackCalories: false }));
    act(() => result.current.settings.updateSettings({ trackCalories: true }));
    expect(result.current.display.showCalories).toBe(true);
  });
});
