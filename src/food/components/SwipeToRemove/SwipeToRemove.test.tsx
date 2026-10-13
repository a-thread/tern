import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { SwipeToRemove } from './SwipeToRemove';

describe('SwipeToRemove', () => {
  it('shows its row and removes it from the Remove button', () => {
    const onRemove = jest.fn();
    const { getByText } = render(
      <SwipeToRemove onRemove={onRemove}>
        <Text>Oats</Text>
      </SwipeToRemove>,
    );
    getByText('Oats');
    fireEvent.press(getByText('Remove', { includeHiddenElements: true }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('can name the button something else', () => {
    const { getByText } = render(
      <SwipeToRemove onRemove={() => {}} label='Delete'>
        <Text>Oats</Text>
      </SwipeToRemove>,
    );
    getByText('Delete', { includeHiddenElements: true });
  });
});
