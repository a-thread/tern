import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { Units } from '@shared/utils/units';
import type { Measure } from '@/domain/food/models/measure';
import { MeasurePicker } from './MeasurePicker';

let mockUnits = Units.Imperial;

jest.mock('@/domain/settings/hooks/useUnits', () => ({
  useUnits: () => ({ units: mockUnits }),
}));

// A packet of instant oatmeal (35 g), as Open Food Facts lists it.
const oatmeal: Measure = {
  per100: { calories: 371, protein: 8.6, carbs: 77, fat: 5.7 },
  portions: [
    { label: 'packet', grams: 35 },
    { label: 'oz', grams: 28.35 },
    { label: 'lb', grams: 453.6 },
  ],
  unit: 'packet',
  quantity: 1,
};

let latest: Measure = oatmeal;

function Harness({ start, drink }: { start: Measure; drink?: boolean }) {
  const [m, setM] = useState(start);
  latest = m;
  const shown = drink
    ? {
        ...m,
        portions: [
          ...m.portions,
          { label: 'fl oz', grams: 30.5 },
          { label: 'ml', grams: 1.03 },
        ],
      }
    : m;
  return <MeasurePicker measure={shown} onChange={setM} />;
}

const unitNames = (view: ReturnType<typeof render>) =>
  view.getAllByRole('radio').map((r) => r.props.accessibilityLabel);

describe('MeasurePicker', () => {
  beforeEach(() => {
    mockUnits = Units.Imperial;
  });

  it('lists every unit in one place, the food’s sizes first, with one chosen', () => {
    const view = render(<Harness start={oatmeal} />);
    expect(unitNames(view)).toEqual(['Packet', 'Ounces', 'Pounds', 'Grams']);
    expect(
      view.getByLabelText('Packet').props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it('counts a size with a stepper, naming the amount and its weight', () => {
    const { getByLabelText, getByText } = render(<Harness start={oatmeal} />);
    expect(getByText('1 packet · 1.2 oz')).toBeTruthy();
    fireEvent.press(getByLabelText('More'));
    expect(latest).toMatchObject({ unit: 'packet', quantity: 1.5 });
    expect(getByText('1.5 packets · 1.9 oz')).toBeTruthy();
  });

  it('types in ounces once ounces are chosen, keeping the weight', () => {
    const { getByLabelText, getByText } = render(<Harness start={oatmeal} />);
    fireEvent.press(getByLabelText('Ounces'));
    expect(latest).toMatchObject({ unit: 'oz', quantity: 1.2 });
    fireEvent.changeText(getByLabelText('Amount in ounces'), '6');
    expect(latest).toMatchObject({ unit: 'oz', quantity: 6 });
    // Already in ounces, so no weight is repeated.
    expect(getByText('6 oz')).toBeTruthy();
  });

  it('types in pounds and caps at 5000 g', () => {
    const { getByLabelText } = render(<Harness start={oatmeal} />);
    fireEvent.press(getByLabelText('Pounds'));
    fireEvent.changeText(getByLabelText('Amount in pounds'), '2');
    expect(latest).toMatchObject({ unit: 'lb', quantity: 2 });
    fireEvent.changeText(getByLabelText('Amount in pounds'), '12');
    expect(latest.quantity).toBe(0);
  });

  it('goes back to counting from the size', () => {
    const { getByLabelText } = render(<Harness start={oatmeal} />);
    fireEvent.press(getByLabelText('Grams'));
    expect(latest.unit).toBeNull();
    fireEvent.press(getByLabelText('Packet'));
    expect(latest.unit).toBe('packet');
  });

  it('orders weights by the Units setting, and weighs in grams on Metric', () => {
    mockUnits = Units.Metric;
    const view = render(<Harness start={oatmeal} />);
    expect(unitNames(view)).toEqual(['Packet', 'Grams', 'Ounces', 'Pounds']);
    expect(view.getByText('1 packet · 35 g')).toBeTruthy();
  });

  it('offers ml and fl oz for a drink', () => {
    const view = render(<Harness start={oatmeal} drink />);
    expect(unitNames(view)).toEqual([
      'Packet',
      'Ounces',
      'Pounds',
      'Grams',
      'Fluid ounces',
      'Millilitres',
    ]);
  });
});
