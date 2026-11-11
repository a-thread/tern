import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { View } from 'react-native';

import { createMemorySettingsRepository } from '@/domain/settings/settings.repository';
import {
  SettingsProvider,
  useSettings,
} from '@/domain/settings/SettingsContext';
import { initialSettings } from '@/domain/settings/models/appSettings';
import { Onboarding, Tip } from '@/domain/settings/models/onboarding';
import { useTips } from './useTips';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: () => true,
}));

const SETTLE = 900;
const group = [Tip.WeekStrip, Tip.Waypoints];

async function setup() {
  const repo = createMemorySettingsRepository();
  // The wizard finished, with these two tips still to see.
  await repo.save({
    ...initialSettings,
    onboarding: {
      ...Onboarding.DONE,
      tipsSeen: Onboarding.DONE.tipsSeen.filter((t) => !group.includes(t)),
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SettingsProvider repo={repo}>{children}</SettingsProvider>
  );
  const rootRef = { current: null } as React.RefObject<View | null>;
  const hook = renderHook(
    () => ({
      settings: useSettings(),
      tips: useTips({
        group,
        relevant: group,
        anchors: {},
        rootRef,
        ready: true,
        settleMs: SETTLE,
      }),
    }),
    { wrapper },
  );
  await waitFor(() => expect(hook.result.current.settings.ready).toBe(true));
  return hook;
}

describe('useTips pacing', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  afterAll(() => warn.mockRestore());

  it('waits for the screen before the first tip, then brings the next one on quickly', async () => {
    jest.useFakeTimers();
    try {
      const hook = await setup();
      expect(hook.result.current.tips.shown).toBeNull();

      await act(async () => {
        jest.advanceTimersByTime(SETTLE - 1);
      });
      expect(hook.result.current.tips.shown).toBeNull();
      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      await waitFor(() =>
        expect(hook.result.current.tips.shown?.tip).toBe(Tip.WeekStrip),
      );

      await act(async () => {
        hook.result.current.tips.gotIt();
      });
      // Well short of the settle time: the screen is already in place.
      await act(async () => {
        jest.advanceTimersByTime(200);
      });
      // Let the measuring finish, without moving the clock on.
      await act(async () => {});
      expect(hook.result.current.tips.shown?.tip).toBe(Tip.Waypoints);
    } finally {
      jest.useRealTimers();
    }
  });
});
