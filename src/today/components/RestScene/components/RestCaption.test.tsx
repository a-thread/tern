import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { RestCaption } from './RestCaption';

describe('RestCaption', () => {
  it('ends the note with a link to where it can be changed', () => {
    const onPress = jest.fn();
    render(
      <RestCaption
        title='Rest day'
        line='A lighter day became a rest day. Your streak carried on.'
        detail='1,203 steps'
        note='Set automatically'
        noteLink={{ label: 'Rest day settings', onPress }}
      />,
    );
    expect(screen.getByText('Set automatically')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Rest day settings' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a note without a link as plain text', () => {
    render(
      <RestCaption
        title='Rest day'
        line='Your streak is safe. Nothing you need to do today.'
        detail=''
        note='Reminders are quiet until tomorrow'
      />,
    );
    expect(screen.getByText('Reminders are quiet until tomorrow')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
