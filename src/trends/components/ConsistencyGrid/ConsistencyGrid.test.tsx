import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { DayState } from '@shared/models/dayState';
import { ConsistencyGrid } from './ConsistencyGrid';

const days = [
  { day: '2026-08-01', state: DayState.Goal },
  { day: '2026-08-02', state: DayState.Rest },
  { day: '2026-08-03', state: DayState.None },
];

describe('ConsistencyGrid', () => {
  it('labels every square with its date for screen readers', () => {
    const ui = render(<ConsistencyGrid days={days} />);
    expect(ui.getAllByRole('button')).toHaveLength(3);
    expect(ui.getByLabelText('Aug 1 · goal met')).toBeTruthy();
    expect(ui.getByLabelText('Aug 3 · no steps')).toBeTruthy();
  });

  it('names a tapped day under the grid, moves to the next tap, and clears on a second tap', () => {
    const ui = render(<ConsistencyGrid days={days} />);
    expect(ui.queryByText(/Aug/)).toBeNull();

    fireEvent.press(ui.getByLabelText('Aug 2 · rest day'));
    expect(ui.getByText('Aug 2 · rest day')).toBeTruthy();

    fireEvent.press(ui.getByLabelText('Aug 1 · goal met'));
    expect(ui.queryByText('Aug 2 · rest day')).toBeNull();
    expect(ui.getByText('Aug 1 · goal met')).toBeTruthy();

    fireEvent.press(ui.getByLabelText('Aug 1 · goal met'));
    expect(ui.queryByText(/Aug/)).toBeNull();
  });
});
