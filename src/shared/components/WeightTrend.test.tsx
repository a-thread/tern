import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { WeightTrend } from './WeightTrend';

const trend = [172.4, 171.9, 171.2];
const days = ['2026-08-01', '2026-08-04', '2026-08-08'];
const lb = (v: number) => `${v.toFixed(1)} lb`;

describe('WeightTrend taps', () => {
  it('is a plain chart without days, as on check-in and logging', () => {
    const ui = render(<WeightTrend trend={trend} />);
    expect(ui.queryAllByRole('button')).toHaveLength(0);
  });

  it('gives each point a button named by its date and value', () => {
    const ui = render(
      <WeightTrend trend={trend} days={days} formatValue={lb} />,
    );
    expect(ui.getAllByRole('button')).toHaveLength(3);
    expect(ui.getByLabelText('Aug 4 · 171.9 lb')).toBeTruthy();
  });

  it('shows the tapped point over the chart, moves with the next tap, and clears on a second tap', () => {
    const ui = render(
      <WeightTrend trend={trend} days={days} formatValue={lb} />,
    );
    expect(ui.queryByText(/lb$/)).toBeNull();

    fireEvent.press(ui.getByLabelText('Aug 1 · 172.4 lb'));
    expect(ui.getByText('Aug 1 · 172.4 lb')).toBeTruthy();

    fireEvent.press(ui.getByLabelText('Aug 8 · 171.2 lb'));
    expect(ui.queryByText('Aug 1 · 172.4 lb')).toBeNull();
    expect(ui.getByText('Aug 8 · 171.2 lb')).toBeTruthy();

    fireEvent.press(ui.getByLabelText('Aug 8 · 171.2 lb'));
    expect(ui.queryByText(/lb$/)).toBeNull();
  });

  it('ignores days that do not line up with the points', () => {
    const ui = render(<WeightTrend trend={trend} days={days.slice(1)} />);
    expect(ui.queryAllByRole('button')).toHaveLength(0);
  });
});
