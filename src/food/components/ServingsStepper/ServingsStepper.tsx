import React, { useState } from 'react';

import { Stepper } from '@shared/components/ui';
import {
  formatCount,
  Servings,
  stepServings,
  typedServings,
} from '@/domain/food/models/servings';

/** Typing past `max` shows `max`, so the field always says what will be logged. */
export function ServingsStepper({
  value,
  onChange,
  max = Servings.MAX,
  valueLabel = 'Servings',
}: {
  value: number;
  onChange: (servings: number) => void;
  max?: number;
  valueLabel?: string;
}) {
  // What is being typed; null shows the value itself.
  const [typed, setTyped] = useState<string | null>(null);
  const step = (delta: number) => {
    setTyped(null);
    onChange(Math.min(stepServings(value, delta), max));
  };
  return (
    <Stepper
      value={typed ?? formatCount(value)}
      onDecrement={() => step(-Servings.STEP)}
      onIncrement={() => step(Servings.STEP)}
      decrementLabel='Fewer servings'
      incrementLabel='More servings'
      onChangeValue={(v) => {
        const text = v.replace(/[^0-9.,]/g, '');
        const n = typedServings(text);
        const over = n !== null && n > max;
        setTyped(over ? formatCount(max) : text);
        if (n !== null) onChange(Math.min(n, max));
      }}
      onEndEditing={() => setTyped(null)}
      valueLabel={valueLabel}
      valueMinWidth={44}
    />
  );
}
