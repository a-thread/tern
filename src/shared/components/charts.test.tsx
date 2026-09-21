import React from 'react';
import { render } from '@testing-library/react-native';

import { StepBars, WeightTrend } from './charts';

/** Every number-looking value in the rendered tree, as text — so NaN and Infinity are easy to spot. */
const rendered = (ui: React.ReactElement) => JSON.stringify(render(ui).toJSON());

describe('WeightTrend', () => {
  it('draws a single weigh-in without NaN coordinates (they crash react-native-svg)', () => {
    const out = rendered(<WeightTrend trend={[172.4]} spread={0.5} height={44} />);
    expect(out).not.toMatch(/NaN|Infinity/);
  });

  it('draws two or more readings', () => {
    const out = rendered(<WeightTrend trend={[172.4, 172.1, 171.8]} goal={165} />);
    expect(out).not.toMatch(/NaN|Infinity/);
  });

  it('renders nothing to draw for no readings, without throwing', () => {
    expect(() => render(<WeightTrend trend={[]} />)).not.toThrow();
  });
});

describe('StepBars', () => {
  it('keeps the labels out of the bar area, so a tall bar cannot reach the text above', () => {
    const days = [
      { label: 'M', value: 9000, state: 'goal' as const },
      { label: 'T', value: 100, state: 'none' as const },
    ];
    const { getByText, toJSON } = render(<StepBars days={days} goal={8000} />);
    getByText('M');
    getByText('T');
    expect(JSON.stringify(toJSON())).not.toMatch(/NaN|Infinity/);
  });
});
