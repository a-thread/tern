import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import {
  BackendProvider,
  createMemoryBackend,
} from '@shared/state/BackendContext';
import { SettingsProvider, changesAnything, useSettings } from './SettingsContext';

async function setup() {
  const backend = createMemoryBackend();
  const save = jest.spyOn(backend.settings, 'save');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={backend}>
      <SettingsProvider>{children}</SettingsProvider>
    </BackendProvider>
  );
  const hook = renderHook(() => useSettings(), { wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  save.mockClear(); // ignore anything saved while loading
  let renders = 0;
  return { ...hook, save, backend, countRenders: () => renders, bump: () => renders++ };
}

describe('updateSettings', () => {
  it('saves and applies a real change', async () => {
    const { result, save } = await setup();
    act(() => result.current.updateSettings({ stepGoal: 9000 }));
    expect(result.current.settings.stepGoal).toBe(9000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the patch changes nothing', async () => {
    const { result, save } = await setup();
    const before = result.current.settings;
    act(() => result.current.updateSettings({ stepGoal: before.stepGoal }));
    act(() => result.current.updateSettings({ units: before.units }));
    expect(save).not.toHaveBeenCalled();
    expect(result.current.settings).toBe(before); // same object: nothing re-rendered
  });

  it('compares nested values by content, so an identical object is not a change', async () => {
    const { result, save } = await setup();
    const before = result.current.settings;
    act(() =>
      result.current.updateSettings({
        macroTargets: { ...before.macroTargets },
        reminders: { ...before.reminders, mealLog: { ...before.reminders.mealLog } },
      }),
    );
    expect(save).not.toHaveBeenCalled();
    expect(result.current.settings).toBe(before);
  });

  it('still saves when only one nested value differs', async () => {
    const { result, save } = await setup();
    const { macroTargets } = result.current.settings;
    act(() =>
      result.current.updateSettings({ macroTargets: { ...macroTargets, protein: macroTargets.protein + 1 } }),
    );
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('saves once per real change when the same value is sent repeatedly', async () => {
    const { result, save } = await setup();
    act(() => {
      for (let i = 0; i < 20; i++) result.current.updateSettings({ calorieTarget: 2300 });
    });
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('changesAnything', () => {
  it('is false for an empty patch', async () => {
    const { result } = await setup();
    expect(changesAnything(result.current.settings, {})).toBe(false);
  });
});

describe('defaults and older saves', () => {
  it('starts a new account at 4,800 steps, 2,100 calories and a 190 lb goal', async () => {
    const { result } = await setup();
    expect(result.current.settings.stepGoal).toBe(4800);
    expect(result.current.settings.calorieTarget).toBe(2100);
    expect(result.current.settings.weightGoalLb).toBe(190);
  });

  it('weighs in weekly and tracks no medication until told otherwise', async () => {
    const { result } = await setup();
    expect(result.current.settings.weighInFrequency).toBe('weekly');
    expect(result.current.settings.medications).toEqual([]);
  });

  it('keeps what an existing account already saved, whatever the new defaults are', async () => {
    const backend = createMemoryBackend();
    await backend.settings.save({ stepGoal: 9000, weightGoalLb: 163, weighInFrequency: 'daily' } as never);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BackendProvider backend={backend}>
        <SettingsProvider>{children}</SettingsProvider>
      </BackendProvider>
    );
    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.settings.stepGoal).toBe(9000);
    expect(result.current.settings.weightGoalLb).toBe(163);
    expect(result.current.settings.weighInFrequency).toBe('daily');
  });

  it('carries over a weigh-in reminder saved under the old weeklyWeighIn key', async () => {
    const backend = createMemoryBackend();
    await backend.settings.save({
      reminders: { weeklyWeighIn: { on: false, weekday: 4, at: 420 } },
      medications: [{ id: 'm1', name: ' Iron ', at: 600, remind: true }, { name: 'broken' }],
    } as never);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BackendProvider backend={backend}>
        <SettingsProvider>{children}</SettingsProvider>
      </BackendProvider>
    );
    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.settings.reminders.weighIn).toEqual({ on: false, weekday: 4, at: 420 });
    expect(result.current.settings.medications).toEqual([{ id: 'm1', name: 'Iron', at: 600, remind: true }]);
  });
});
