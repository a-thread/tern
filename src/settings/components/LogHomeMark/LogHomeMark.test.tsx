import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { LogHome } from '../../models/logHome';
import { LogHomeMark } from './LogHomeMark';

// The test icon stand-in renders its name, hidden from screen readers like a real glyph.
const HIDDEN = { includeHiddenElements: true };

describe('LogHomeMark', () => {
  it('shows a cloud with a check once the log is synced', () => {
    render(<LogHomeMark home={LogHome.Account} />);
    expect(screen.getByText('[cloud-check-outline]', HIDDEN)).toBeTruthy();
    expect(screen.queryByText('[cellphone-check]', HIDDEN)).toBeNull();
  });

  it('shows a phone with a check while the log is kept on this phone', () => {
    render(<LogHomeMark home={LogHome.Phone} />);
    expect(screen.getByText('[cellphone-check]', HIDDEN)).toBeTruthy();
    expect(screen.queryByText('[cloud-check-outline]', HIDDEN)).toBeNull();
  });

  it('stays out of the screen reader, beside text that says it already', () => {
    render(<LogHomeMark home={LogHome.Account} />);
    expect(screen.queryByText('[cloud-check-outline]')).toBeNull();
  });
});
