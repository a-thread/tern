import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '../BackendContext';
import { AppProviders } from '../AppProviders';
import { ToastProvider } from '@shared/state/ToastContext';
import RootNavigator from '../navigation/RootNavigator';
import { initialSettings } from '../domain/settings/models/appSettings';
import { syncReminders } from '../domain/settings/reminders';
import { useSettings } from '../domain/settings/SettingsContext';

jest.mock('../domain/settings/reminders', () => ({
  SyncResult: { Ok: 'ok', Denied: 'denied' },
  syncReminders: jest.fn(async () => 'ok'),
  syncStreakAlerts: jest.fn(async () => undefined),
}));
jest.mock('@shared/hooks/useReduceMotion', () => ({
  useReduceMotion: () => true,
}));
// The test renderer has no layout, so every view measures as a small box near the top.
jest.mock('@shared/utils/measureInWindow', () => ({
  measureInWindow: async () => ({ x: 16, y: 120, width: 320, height: 40 }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Hands the test the settings, to change one the way a Settings screen would. */
const settingsRef: { current: ReturnType<typeof useSettings> | null } = {
  current: null,
};
function Grab() {
  settingsRef.current = useSettings();
  return null;
}

async function openApp(backend: Backend = createMemoryBackend()) {
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <BackendProvider backend={backend}>
          <AppProviders>
            <Grab />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AppProviders>
        </BackendProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
  return backend;
}

const press = async (text: string) => {
  await act(async () => fireEvent.press(screen.getByText(text)));
};

beforeEach(() => jest.mocked(syncReminders).mockClear());

describe('setup wizard', () => {
  it('opens a new install on the wizard, and "Skip setup" lands on Today without asking for notifications', async () => {
    const backend = await openApp();
    expect(
      await screen.findByText('Progress answers to your pace'),
    ).toBeTruthy();

    await press('Skip setup');
    expect((await screen.findAllByText('Today')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Progress answers to your pace')).toBeNull();
    const saved = await backend.settings.load();
    expect(saved?.onboarding).toMatchObject({
      wizardDone: true,
      notificationsAsked: false,
    });
    // Nothing shows as on in Settings that can't fire without the permission.
    expect(saved?.reminders?.mealLog.on).toBe(false);
    expect(saved?.reminders?.weighIn.on).toBe(false);
    expect(saved?.reminders?.streak.on).toBe(false);
    expect(syncReminders).not.toHaveBeenCalled();
  });

  it('writes choices as it goes, skips calorie screens without numbers, and asks once reminders are turned on', async () => {
    const backend = await openApp();
    await screen.findByText('Progress answers to your pace');
    await press('Get started');

    await screen.findByText('What to keep track of');
    await act(async () => fireEvent.press(screen.getByLabelText('Water')));
    await press('Next');

    // Steps, when the phone has a health app, then the food choice.
    if (screen.queryByText('Steps come from your phone')) await press('Skip');
    await screen.findByText('Food logging options');
    await act(async () =>
      fireEvent.press(screen.getByLabelText('Track calories')),
    );
    await press('Next');

    // No calorie target or zone without calorie numbers; macros, with intake bars offered there.
    expect(await screen.findByText('Your macro targets')).toBeTruthy();
    expect(screen.queryByText('Your daily calorie target')).toBeNull();
    expect(screen.getByLabelText('Show intake bars')).toBeTruthy();
    await press('Next');
    expect(await screen.findByText('A nudge now and then?')).toBeTruthy();
    await press('Turn on reminders');

    await screen.findAllByText('Today');
    const saved = await backend.settings.load();
    expect(saved).toMatchObject({
      trackWater: true,
      trackCalories: false,
      trackMacros: true,
    });
    expect(saved?.onboarding).toMatchObject({
      wizardDone: true,
      notificationsAsked: true,
    });
    expect(syncReminders).toHaveBeenCalled();
  });

  it('shows the calorie target, then the zone once intake bars are on', async () => {
    await openApp();
    await screen.findByText('Progress answers to your pace');
    await press('Get started');
    await press('Next');
    if (screen.queryByText('Steps come from your phone')) await press('Skip');
    await press('Next'); // with calories

    expect(await screen.findByText('Your daily calorie target')).toBeTruthy();
    await act(async () =>
      fireEvent.press(screen.getByLabelText('Show intake bars')),
    );
    await press('Next');
    expect(await screen.findByText('Your target zone')).toBeTruthy();
    await press('Skip');

    // Then macros; intake bars were already asked about with calories.
    expect(await screen.findByText('Your macro targets')).toBeTruthy();
    expect(screen.queryByLabelText('Show intake bars')).toBeNull();
    expect(screen.getByLabelText('Protein as a minimum')).toBeTruthy();
    await press('Skip');
    expect(await screen.findByText('A nudge now and then?')).toBeTruthy();
  });

  it('goes back a screen, keeping what was chosen', async () => {
    await openApp();
    await screen.findByText('Progress answers to your pace');
    expect(screen.queryByLabelText('Back')).toBeNull();
    await press('Get started');
    await screen.findByText('What to keep track of');
    await act(async () => fireEvent.press(screen.getByLabelText('Water')));
    await press('Next');
    if (screen.queryByText('Steps come from your phone')) await press('Skip');
    await screen.findByText('Food logging options');

    // Back from the food step, past Steps if it was shown, to what to track.
    while (!screen.queryByText('What to keep track of')) {
      await act(async () =>
        fireEvent.press(screen.getAllByLabelText('Back').at(-1)!),
      );
    }
    expect(
      screen.getByLabelText('Water').props.accessibilityState,
    ).toMatchObject({ checked: true });
  });

  it('keeps the calorie screens for calories without macros', async () => {
    const backend = await openApp();
    await screen.findByText('Progress answers to your pace');
    await press('Get started');
    await press('Next');
    if (screen.queryByText('Steps come from your phone')) await press('Skip');
    await act(async () =>
      fireEvent.press(screen.getByLabelText('Track macros')),
    );
    await press('Next');

    expect(await screen.findByText('Your daily calorie target')).toBeTruthy();
    expect(await backend.settings.load()).toMatchObject({
      trackCalories: true,
      showCalories: true,
      trackMacros: false,
    });
  });

  it('never shows to someone who already has saved settings', async () => {
    const backend = createMemoryBackend();
    // Saved before onboarding existed: no `onboarding` key at all.
    const older: Partial<typeof initialSettings> = {
      ...initialSettings,
      stepGoal: 8000,
    };
    delete older.onboarding;
    await backend.settings.save(older as typeof initialSettings);

    await openApp(backend);
    expect((await screen.findAllByText('Today')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Progress answers to your pace')).toBeNull();
    expect(screen.queryByText(/Getting started/)).toBeNull();
  });

  it('after a skip, asks for notifications only once a reminder is changed', async () => {
    await openApp();
    await screen.findByText('Progress answers to your pace');
    await press('Skip setup');
    await screen.findAllByText('Today');
    expect(syncReminders).not.toHaveBeenCalled();

    const { settings, updateSettings } = settingsRef.current!;
    await act(async () =>
      updateSettings({
        reminders: {
          ...settings.reminders,
          mood: { ...settings.reminders.mood, on: true },
        },
        trackMood: true,
      }),
    );
    await waitFor(() => expect(syncReminders).toHaveBeenCalled());
    expect(settingsRef.current!.settings.onboarding.notificationsAsked).toBe(
      true,
    );
  });

  it('shows the tips on Today one at a time, skipping any that don’t apply', async () => {
    await openApp();
    await screen.findByText('Progress answers to your pace');
    await press('Skip setup');

    // The first tip, counted out of the tips that apply today.
    expect(
      await screen.findByText(/Tap a day to look back/, {}, { timeout: 4000 }),
    ).toBeTruthy();
    const count = screen.getByText(/^1 of \d · Skip tips$/);
    await press('Got it');

    // On to the next one that applies (the rest-day tip only with a rest-day link).
    expect(
      await screen.findByText(
        /Rest days keep your streak|Waypoints are for showing up/,
        {},
        { timeout: 4000 },
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/Tap a day to look back/)).toBeNull();
    expect(count).toBeTruthy();
  }, 15000);

  it('"Skip tips" ends them all', async () => {
    await openApp();
    await screen.findByText('Progress answers to your pace');
    await press('Skip setup');

    await screen.findByText(/Tap a day to look back/, {}, { timeout: 4000 });
    await act(async () => fireEvent.press(screen.getByText(/Skip tips/)));
    await waitFor(() =>
      expect(settingsRef.current!.settings.onboarding.tipsSeen).toHaveLength(3),
    );
    expect(screen.queryByText('Got it')).toBeNull();
  }, 15000);

  it('offers the getting-started card after the wizard, and hides it with its ×', async () => {
    await openApp();
    await screen.findByText('Progress answers to your pace');
    await press('Skip setup');

    expect(await screen.findByText(/Getting started/)).toBeTruthy();
    expect(screen.getByText('Review reminders')).toBeTruthy();
    await act(async () =>
      fireEvent.press(screen.getByLabelText('Hide getting started')),
    );
    expect(screen.queryByText(/Getting started/)).toBeNull();
  });
});
