import React from 'react';
import { render } from '@testing-library/react-native';

import LoadingBird from './LoadingBird';

afterEach(() => jest.restoreAllMocks());

const flatten = (style: unknown) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

describe('LoadingBird', () => {
  it('announces itself as loading, and can say what is loading', () => {
    const { getByLabelText, rerender } = render(<LoadingBird />);
    expect(getByLabelText('Loading').props.accessibilityRole).toBe('progressbar');
    rerender(<LoadingBird label='Searching foods' />);
    getByLabelText('Searching foods');
  });

  it('is a square, sized by its width', () => {
    const { getByLabelText } = render(<LoadingBird size={100} />);
    const style = flatten(getByLabelText('Loading').props.style);
    expect(style.width).toBe(100);
    expect(style.height).toBe(100);
  });

  it('can be scenery: nothing for a screen reader to announce', () => {
    const { queryByLabelText } = render(<LoadingBird decorative />);
    expect(queryByLabelText('Loading', { includeHiddenElements: true })).toBeNull();
  });

  it('beats its wings faster at a higher speed, so birds can be out of step', () => {
    jest.useFakeTimers();
    const interval = jest.spyOn(global, 'setInterval');
    render(<LoadingBird speed={1} />);
    jest.advanceTimersByTime(1);
    const normal = interval.mock.calls[0][1] as number;
    interval.mockClear();
    render(<LoadingBird speed={2} />);
    jest.advanceTimersByTime(1);
    expect(interval.mock.calls[0][1]).toBe(normal / 2);
    jest.useRealTimers();
  });

  it('waits before the first beat when given a delay', () => {
    jest.useFakeTimers();
    const interval = jest.spyOn(global, 'setInterval');
    render(<LoadingBird delay={400} />);
    jest.advanceTimersByTime(399);
    expect(interval).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(interval).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
