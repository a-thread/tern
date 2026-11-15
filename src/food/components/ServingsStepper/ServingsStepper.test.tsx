import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ServingsStepper } from './ServingsStepper';

let latest = 1;

function Harness({ max }: { max?: number }) {
  const [v, setV] = useState(1);
  latest = v;
  return <ServingsStepper value={v} onChange={setV} max={max} />;
}

describe('ServingsStepper', () => {
  it('steps by a quarter', () => {
    const { getByLabelText } = render(<Harness />);
    fireEvent.press(getByLabelText('More servings'));
    expect(latest).toBe(1.25);
    fireEvent.press(getByLabelText('Fewer servings'));
    fireEvent.press(getByLabelText('Fewer servings'));
    expect(latest).toBe(0.75);
  });

  it('takes a typed number to the nearest quarter, keeping the last one while it is not a number', () => {
    const { getByLabelText } = render(<Harness />);
    const field = getByLabelText('Servings');
    fireEvent.changeText(field, '2,75');
    expect(latest).toBe(2.75);
    fireEvent.changeText(field, '1.3');
    expect(latest).toBe(1.25);
    fireEvent.changeText(field, '');
    expect(latest).toBe(1.25);
    fireEvent(field, 'blur');
    expect(field.props.value).toBe('1.25');
  });

  it('never goes past the most, and says so in the field', () => {
    const { getByLabelText } = render(<Harness max={8} />);
    const field = getByLabelText('Servings');
    fireEvent.changeText(field, '80');
    expect(latest).toBe(8);
    expect(getByLabelText('Servings').props.value).toBe('8');
    fireEvent.press(getByLabelText('More servings'));
    expect(latest).toBe(8);
  });
});
