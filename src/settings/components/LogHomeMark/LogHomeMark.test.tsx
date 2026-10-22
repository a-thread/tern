import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { LogHome } from '../../models/logHome';
import { LogHomeMark } from './LogHomeMark';

// The test icon stand-in renders its name, hidden from screen readers like a real glyph.
const HIDDEN = { includeHiddenElements: true };

describe('LogHomeMark', () => {
  it('shows a cloud with a check, and says so, once the data is synced', () => {
    render(<LogHomeMark home={LogHome.Account} variant='corner' />);
    expect(screen.getByLabelText('Synced to your account')).toBeTruthy();
    expect(screen.getByText('[cloud-check-outline]', HIDDEN)).toBeTruthy();
  });

  it('shows a phone with a check, and says so, while the data is on this phone', () => {
    render(<LogHomeMark home={LogHome.Phone} variant='corner' />);
    expect(screen.getByLabelText('Kept on this phone')).toBeTruthy();
    expect(screen.getByText('[cellphone-check]', HIDDEN)).toBeTruthy();
  });

  it('stays out of the screen reader as a row icon, beside text that says it already', () => {
    render(<LogHomeMark home={LogHome.Account} variant='badge' />);
    expect(screen.queryByLabelText('Synced to your account')).toBeNull();
    expect(screen.getByText('[cloud-check-outline]', HIDDEN)).toBeTruthy();
    expect(screen.queryByText('[cloud-check-outline]')).toBeNull();
  });
});
