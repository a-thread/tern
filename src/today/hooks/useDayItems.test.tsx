import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AppProviders } from '../../AppProviders';
import { BackendProvider, createMemoryBackend } from '../../BackendContext';
import { createMemoryWeightRepository } from '../../domain/weight/weight.repository';
import { useWeight } from '../../domain/weight/WeightContext';
import { useSettings } from '../../domain/settings/SettingsContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { Frequency } from '@shared/models/frequency';
import { useDayItems } from './useDayItems';

jest.mock('../../RemindersSync', () => ({ RemindersSync: () => null }));

const today = dayKey();

async function setup() {
  const backend = {
    ...createMemoryBackend(),
    // Nothing weighed yet, so a weigh-in is due.
    weight: createMemoryWeightRepository([]),
  };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <BackendProvider backend={backend}>
        <AppProviders>{children}</AppProviders>
      </BackendProvider>
    </ToastProvider>
  );
  const hook = renderHook(
    () => ({
      items: useDayItems(),
      weight: useWeight(),
      settings: useSettings(),
    }),
    { wrapper },
  );
  await waitFor(() => expect(hook.result.current.weight.ready).toBe(true));
  await act(async () =>
    hook.result.current.settings.updateSettings({
      trackWeight: true,
      weighInFrequency: Frequency.Daily,
    }),
  );
  return hook;
}

const hasWeightRow = (items: ReturnType<typeof useDayItems>) =>
  items.openItems.some((i) => i.kind === 'weight');

describe('skipping the weigh-in', () => {
  it('moves it from Left to do to Today so far, and Undo puts it back', async () => {
    const { result } = await setup();
    expect(hasWeightRow(result.current.items)).toBe(true);
    expect(result.current.items.weighInSkipped).toBe(false);

    await act(async () => result.current.weight.setWeighInSkipped(today, true));

    expect(hasWeightRow(result.current.items)).toBe(false);
    expect(result.current.items.weighInSkipped).toBe(true);
    expect(result.current.items.anythingDone).toBe(true);

    await act(async () =>
      result.current.weight.setWeighInSkipped(today, false),
    );

    expect(hasWeightRow(result.current.items)).toBe(true);
    expect(result.current.items.weighInSkipped).toBe(false);
  });

  it('does not count as having weighed in', async () => {
    const { result } = await setup();
    await act(async () => result.current.weight.setWeighInSkipped(today, true));
    expect(result.current.items.summary.weighedIn).toBeNull();
  });
});
