import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMemoryBackend } from '@app/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { ViewedDayProvider, useViewedDay, type ViewedDay } from '@shared/state/ViewedDayContext';
import { addDays, dayKey, formatLongDate } from '@shared/utils/date';
import { FoodProvider } from '@food/FoodContext';
import { WaypointsProvider } from '@journey/WaypointsContext';
import { SettingsProvider } from '@settings/SettingsContext';
import { WaterProvider } from '@water/WaterContext';
import FoodScreen from './FoodScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
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

async function open() {
  const backend = createMemoryBackend();
  const viewed: { current: ViewedDay | null } = { current: null };
  const ui = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <ViewedDayProvider>
              <FoodProvider repo={backend.food}>
                <WaterProvider repo={backend.water}>
                  <Grab into={viewed} />
                  <FoodScreen />
                </WaterProvider>
              </FoodProvider>
            </ViewedDayProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
  await waitFor(() => expect(ui.getAllByText('Add food').length).toBeGreaterThan(0));
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
    await waitFor(() => expect(ui.getAllByText('Add food').length).toBeGreaterThan(0));
    expect(ui.getByText('Back to today')).toBeTruthy();
  });

  it('shows an earlier day read-only, and goes back to today', async () => {
    const ui = await open();
    await ui.view(addDays(today, -3));
    await waitFor(() => expect(ui.getByText('Greek yogurt with berries')).toBeTruthy());
    expect(ui.queryByText('Add food')).toBeNull();
    expect(ui.queryByText('Save as meal')).toBeNull();
    expect(ui.queryByText('Other')).toBeNull(); // water can't be added either

    fireEvent.press(ui.getByText('Back to today'));
    await waitFor(() => expect(ui.getAllByText('Add food').length).toBeGreaterThan(0));
    expect(ui.getByText(formatLongDate(today))).toBeTruthy();
  });
});
