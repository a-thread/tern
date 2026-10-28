import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMemoryBackend } from '../BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import {
  ViewedDayProvider,
  useViewedDay,
  type ViewedDay,
} from '@shared/state/ViewedDayContext';
import { addDays, dayKey, formatLongDate } from '@shared/utils/date';
import { FoodProvider } from '../domain/food/FoodContext';
import { WaypointsProvider } from '../domain/waypoints/WaypointsContext';
import { SettingsProvider } from '../domain/settings/SettingsContext';
import { WaterProvider } from '../domain/water/WaterContext';
import { MealCheckInsProvider } from '../domain/meal-check-ins/MealCheckInsContext';
import { initialSettings } from '../domain/settings/models/appSettings';
import { Onboarding, Tips } from '../domain/settings/models/onboarding';
import FoodScreen from './FoodScreen';

jest.mock('@shared/hooks/useReduceMotion', () => ({
  useReduceMotion: () => true,
}));
// The test renderer has no layout, so every view measures as a small box near the top.
jest.mock('@shared/utils/measureInWindow', () => ({
  measureInWindow: async () => ({ x: 16, y: 120, width: 320, height: 40 }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
  useIsFocused: () => true,
}));

const today = dayKey();
const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Hands the test the viewed day, to pick days the way the week strip does. */
function Grab({ into }: { into: { current: ViewedDay | null } }) {
  into.current = useViewedDay();
  return null;
}

async function open({ checkInAfterMeals = false, withTips = false } = {}) {
  const backend = createMemoryBackend();
  // Tips wait for the setup wizard, so tests that want them have finished it (and Today's).
  if (checkInAfterMeals || withTips)
    await backend.settings.save({
      ...initialSettings,
      checkInAfterMeals,
      onboarding: withTips
        ? { ...Onboarding.DONE, tipsSeen: [...Tips.TODAY] }
        : initialSettings.onboarding,
    });
  const viewed: { current: ViewedDay | null } = { current: null };
  const ui = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <ViewedDayProvider>
              <FoodProvider repo={backend.food}>
                <WaterProvider repo={backend.water}>
                  <MealCheckInsProvider repo={backend.mealCheckIns}>
                    <Grab into={viewed} />
                    <FoodScreen />
                  </MealCheckInsProvider>
                </WaterProvider>
              </FoodProvider>
            </ViewedDayProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
  await waitFor(() =>
    expect(ui.getAllByText('Add food').length).toBeGreaterThan(0),
  );
  const view = async (day: string) => {
    await act(async () => viewed.current!.setDay(day));
    await waitFor(() => expect(ui.getByText(formatLongDate(day))).toBeTruthy());
  };
  return { ...ui, view };
}

describe('FoodScreen', () => {
  it('shows today with everything editable and no way "back"', async () => {
    const ui = await open();
    expect(ui.getByText(formatLongDate(today))).toBeTruthy();
    expect(ui.queryByText('Back to today')).toBeNull();
    expect(ui.getAllByText('Save as meal').length).toBeGreaterThan(0);
  });

  it('lets yesterday be filled in', async () => {
    const ui = await open();
    await ui.view(addDays(today, -1));
    await waitFor(() =>
      expect(ui.getAllByText('Add food').length).toBeGreaterThan(0),
    );
    expect(ui.getByText('Back to today')).toBeTruthy();
  });

  it('shows an earlier day read-only, and goes back to today', async () => {
    const ui = await open();
    await ui.view(addDays(today, -3));
    await waitFor(() =>
      expect(ui.getByText('Greek yogurt with berries')).toBeTruthy(),
    );
    expect(ui.queryByText('Add food')).toBeNull();
    expect(ui.queryByText('Save as meal')).toBeNull();
    expect(ui.queryByText('Other')).toBeNull(); // water can't be added either

    fireEvent.press(ui.getByText('Back to today'));
    await waitFor(() =>
      expect(ui.getAllByText('Add food').length).toBeGreaterThan(0),
    );
    expect(ui.getByText(formatLongDate(today))).toBeTruthy();
  });

  it('steps back a day with the arrows, and not past today', async () => {
    const ui = await open();
    expect(
      ui.getByLabelText('Next day').props.accessibilityState.disabled,
    ).toBe(true);

    fireEvent.press(ui.getByLabelText('Previous day'));
    await waitFor(() =>
      expect(ui.getByText(formatLongDate(addDays(today, -1)))).toBeTruthy(),
    );
    expect(ui.getByText('Back to today')).toBeTruthy();

    fireEvent.press(ui.getByLabelText('Next day'));
    await waitFor(() =>
      expect(ui.getByText(formatLongDate(today))).toBeTruthy(),
    );
  });

  it('offers no meal check-in until it is turned on', async () => {
    const ui = await open();
    expect(ui.queryByText('How was it?')).toBeNull();
  });

  it('offers a check-in under each meal with food once it is on', async () => {
    const ui = await open({ checkInAfterMeals: true });
    await waitFor(() =>
      expect(ui.getAllByText('How was it?').length).toBeGreaterThan(0),
    );
  });

  it('tips only what applies: with every core meal logged, just the swipe', async () => {
    const ui = await open({ withTips: true });
    expect(
      await ui.findByText(/Swipe a food left/, {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(ui.getByText('1 of 1')).toBeTruthy();
    expect(ui.queryByText(/counts toward a full log/)).toBeNull();

    await act(async () => fireEvent.press(ui.getByText('Got it')));
    expect(ui.queryByText(/Swipe a food left/)).toBeNull();
  });
});
