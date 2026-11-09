import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { Units } from '@shared/utils/units';
import type { Measure } from '@/domain/food/models/measure';
import { MeasurePicker } from './MeasurePicker';

let mockUnits = Units.Imperial;
jest.mock('@/domain/food/hooks/useFoodDisplay', () => ({
  useFoodDisplay: () => ({ showCalories: false }),
}));
jest.mock('@/domain/settings/hooks/useUnits', () => ({
  useUnits: () => ({ units: mockUnits }),
}));

const food: Measure = {
  per100: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  portions: [
    { label: 'large egg', grams: 50 },
    { label: 'oz', grams: 28.35 },
    { label: 'lb', grams: 453.6 },
  ],
  unit: 'large egg',
  quantity: 2,
};

let latest: Measure = food;

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

describe('MeasurePicker', () => {
  beforeEach(() => {
    mockUnits = Units.Imperial;
  });

  it('shows only household portions as chips, and a unit switch', () => {
    const { getByText, queryByText, getByLabelText } = render(
      <Harness start={food} />,
    );
    expect(getByText('Large egg')).toBeTruthy();
    expect(queryByText('Grams')).toBeNull();
    expect(getByLabelText('Ounces')).toBeTruthy();
    expect(getByLabelText('Pounds')).toBeTruthy();
    expect(getByLabelText('Grams')).toBeTruthy();
  });

  it('goes to typed mode in ounces from the switch, keeping the weight', () => {
    const { getByLabelText } = render(<Harness start={food} />);
    fireEvent.press(getByLabelText('Ounces'));
    expect(latest).toMatchObject({ unit: 'oz', quantity: 3.5 });
    const field = getByLabelText('Amount in ounces');
    fireEvent.changeText(field, '6');
    expect(latest).toMatchObject({ unit: 'oz', quantity: 6 });
    expect(getByLabelText('Ounces').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('types in pounds and caps at 5000 g', () => {
    const { getByLabelText } = render(<Harness start={food} />);
    fireEvent.press(getByLabelText('Pounds'));
    fireEvent.changeText(getByLabelText('Amount in pounds'), '2');
    expect(latest).toMatchObject({ unit: 'lb', quantity: 2 });
    fireEvent.changeText(getByLabelText('Amount in pounds'), '12');
    expect(latest.quantity).toBe(0);
  });

  it('goes back to counted mode from a chip', () => {
    const { getByLabelText, getByText } = render(<Harness start={food} />);
    fireEvent.press(getByLabelText('Grams'));
    expect(latest.unit).toBeNull();
    fireEvent.press(getByText('Large egg'));
    expect(latest.unit).toBe('large egg');
  });

  it('orders the switch by the Units setting', () => {
    mockUnits = Units.Metric;
    const { getAllByRole } = render(<Harness start={food} />);
    const names = getAllByRole('radio').map((r) => r.props.accessibilityLabel);
    expect(names).toEqual(['Grams', 'Ounces', 'Pounds']);
  });

  it('offers ml and fl oz for a drink', () => {
    const { getAllByRole } = render(<Harness start={food} drink />);
    const names = getAllByRole('radio').map((r) => r.props.accessibilityLabel);
    expect(names).toEqual([
      'Ounces',
      'Pounds',
      'Grams',
      'Fluid ounces',
      'Millilitres',
    ]);
  });
});
