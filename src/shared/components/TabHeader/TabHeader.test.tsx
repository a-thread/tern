import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { TabHeader } from './TabHeader';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('TabHeader', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('shows the eyebrow, the title and whatever the tab adds', () => {
    const ui = render(
      <TabHeader
        eyebrow='October'
        title='Trends'
        accessory={<Text>Extra</Text>}
      />,
    );
    expect(ui.getByText('October')).toBeTruthy();
    expect(ui.getByText('Trends')).toBeTruthy();
    expect(ui.getByText('Extra')).toBeTruthy();
  });

  it('opens Settings from the gear', () => {
    const ui = render(<TabHeader eyebrow='October' title='Trends' />);
    fireEvent.press(ui.getByLabelText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });
});
