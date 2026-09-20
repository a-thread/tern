import React from 'react';
import { Text } from 'react-native';
import { render, act } from '@testing-library/react-native';

import { useCountUp } from '../hooks/useAnimatedNumber';
import { AnimatedNumber, CountUp } from './AnimatedNumber';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

/** Runs the clock forward in small steps, like a device would. */
const play = (ms: number) => {
  for (let t = 0; t < ms; t += 33) {
    act(() => {
      jest.advanceTimersByTime(33);
    });
  }
};

describe('CountUp', () => {
  it('rolls up to the target and shows it formatted', () => {
    const { getByText } = render(<CountUp target={6842} />);
    play(2100);
    getByText('6,842');
  });

  it('starts over when replayed', () => {
    const { getByText, rerender } = render(<CountUp target={5000} replayKey={0} />);
    play(2100);
    getByText('5,000');
    rerender(<CountUp target={5000} replayKey={1} />);
    play(100); // just after the restart it is back near zero, not still at 5,000
    expect(() => getByText('5,000')).toThrow();
    play(2100);
    getByText('5,000');
  });
});

describe('AnimatedNumber', () => {
  it('shows the value at first, then eases to a new one', () => {
    const { getByText, rerender } = render(<AnimatedNumber value={1240} />);
    getByText('1,240');
    rerender(<AnimatedNumber value={1280} />);
    play(1000);
    getByText('1,280');
  });
});

describe('re-renders of the screen that shows the number', () => {
  const renderCountWhilePlaying = (screen: () => React.ReactElement, counter: { n: number }) => {
    render(screen());
    counter.n = 0; // ignore the first paint
    play(2100);
    return counter.n;
  };

  it('the screen does not re-render while the animation lives in <CountUp>', () => {
    const counter = { n: 0 };
    function Screen() {
      counter.n++;
      return <CountUp target={6842} />;
    }
    expect(renderCountWhilePlaying(() => <Screen />, counter)).toBe(0);
  });

  it('the screen re-renders many times when the hook is used in it directly (the old way)', () => {
    const counter = { n: 0 };
    function Screen() {
      counter.n++;
      const steps = useCountUp(6842);
      return <Text>{steps}</Text>;
    }
    expect(renderCountWhilePlaying(() => <Screen />, counter)).toBeGreaterThan(10);
  });
});
