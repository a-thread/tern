import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider, useSettings } from '../../settings/SettingsContext';
import { useFoodDisplay } from './useFoodDisplay';

async function setup() {
  const backend = createMemoryBackend();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SettingsProvider repo={backend.settings}>{children}</SettingsProvider>
  );
  const hook = renderHook(
    () => ({ display: useFoodDisplay(), settings: useSettings() }),
    { wrapper },
  );
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

describe('useFoodDisplay with food off', () => {
  it('shows no calories, macros or intake, and keeps the saved switches', async () => {
    const { result } = await setup();
    act(() => result.current.settings.updateSettings({ trackFood: false }));
    expect(result.current.display).toMatchObject({
      showCalories: false,
      showMacros: false,
      tracksIntake: false,
    });
    expect(result.current.settings.settings.trackCalories).toBe(true);
  });
});

describe('useFoodDisplay macros', () => {
  it('tracks macros apart from calories', async () => {
    const { result } = await setup();
    act(() => result.current.settings.updateSettings({ trackCalories: false }));
    expect(result.current.display.showMacros).toBe(true);
    expect(result.current.display.tracksIntake).toBe(true);

    act(() =>
      result.current.settings.updateSettings({
        trackCalories: true,
        trackMacros: false,
      }),
    );
    expect(result.current.display.showMacros).toBe(false);
    expect(result.current.display.showCalories).toBe(true);
  });

  it('has no intake to show when neither is tracked', async () => {
    const { result } = await setup();
    act(() =>
      result.current.settings.updateSettings({
        trackCalories: false,
        trackMacros: false,
      }),
    );
    expect(result.current.display.tracksIntake).toBe(false);
  });
});
