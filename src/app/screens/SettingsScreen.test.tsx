import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BackendProvider, createMemoryBackend } from '@app/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import WaterSettingsScreen from '@water/screens/WaterSettingsScreen';
import SettingsScreen from './SettingsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

let update: ReturnType<typeof useSettings>['updateSettings'];
function Grab() {
  update = useSettings().updateSettings;
  return null;
}

async function open(screen: React.ReactElement) {
  const backend = createMemoryBackend();
  const ui = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <BackendProvider backend={backend}>
          <SettingsProvider repo={backend.settings}>
            <Grab />
            {screen}
          </SettingsProvider>
        </BackendProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
  await waitFor(() => expect(ui.toJSON()).not.toBeNull());
  return ui;
}

beforeEach(() => mockNavigate.mockClear());

describe('Settings index', () => {
  const props = {
    navigation: { navigate: mockNavigate, getParent: () => ({ goBack: jest.fn() }) },
    route: { key: 'root', name: 'SettingsRoot' },
  } as unknown as React.ComponentProps<typeof SettingsScreen>;

  it('lists each section with a summary, and no switches or steppers of its own', async () => {
    const ui = await open(<SettingsScreen {...props} />);
    await waitFor(() => expect(ui.getByText('Steps and activity')).toBeTruthy());
    for (const title of ['Food', 'Weight', 'Water', 'Mood and stress', 'Medication', 'Reminders', 'Health data', 'Units']) {
      expect(ui.getByText(title)).toBeTruthy();
    }
    // Only Units is set right here; everything else is a page away.
    expect(ui.UNSAFE_queryAllByProps({ accessibilityRole: 'switch' })).toHaveLength(0);
  });

  it('opens a section page', async () => {
    const ui = await open(<SettingsScreen {...props} />);
    await waitFor(() => expect(ui.getByText('Water')).toBeTruthy());
    fireEvent.press(ui.getByText('Water'));
    expect(mockNavigate).toHaveBeenCalledWith('WaterSettings');
  });

  it('keeps summaries in step with the settings', async () => {
    const ui = await open(<SettingsScreen {...props} />);
    await act(async () => update({ trackWater: false }));
    await waitFor(() => expect(ui.getAllByText('Off').length).toBeGreaterThan(0));
    await act(async () => update({ trackWater: true, waterGoalOz: 80 }));
    await waitFor(() => expect(ui.getByText('80 oz a day')).toBeTruthy());
  });
});

describe('Water settings page', () => {
  it('offers the reminder only while water is tracked', async () => {
    const ui = await open(<WaterSettingsScreen />);
    await act(async () => update({ trackWater: false }));
    await waitFor(() => expect(ui.getByText('Track water')).toBeTruthy());
    expect(ui.queryByText('Water reminder')).toBeNull();

    await act(async () => update({ trackWater: true }));
    await waitFor(() => expect(ui.getByText('Water reminder')).toBeTruthy());
  });
});
