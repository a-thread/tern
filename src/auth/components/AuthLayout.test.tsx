import React from 'react';
import { BackHandler, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthLayout } from './AuthLayout';

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const layout = (onBack?: () => void) => (
  <SafeAreaProvider initialMetrics={metrics}>
    <AuthLayout title='Tern' subtitle='Sub' onBack={onBack} backLabel='Settings'>
      <Text>Form</Text>
    </AuthLayout>
  </SafeAreaProvider>
);

describe('AuthLayout', () => {
  it('goes back from its back button', () => {
    const onBack = jest.fn();
    const ui = render(layout(onBack));
    fireEvent.press(ui.getByLabelText('Settings'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("listens for Android's back button only while it can go back", () => {
    const add = jest.spyOn(BackHandler, 'addEventListener');
    const ui = render(layout());
    expect(ui.queryByLabelText('Settings')).toBeNull();
    expect(add).not.toHaveBeenCalled();

    ui.rerender(layout(jest.fn()));
    expect(add).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    add.mockRestore();
  });
});
