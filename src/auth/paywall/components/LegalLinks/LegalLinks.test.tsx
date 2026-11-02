import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import { LegalLinks } from './LegalLinks';
import { LegalUrls, legalLinks } from './utils/legalLinks';

describe('legalLinks', () => {
  it('links the terms of use and the privacy policy on iPhone', () => {
    expect(legalLinks('ios').map((l) => l.url)).toEqual([
      LegalUrls.APPLE_TERMS,
      LegalUrls.PRIVACY,
    ]);
  });

  it('links only the privacy policy on Android, where Apple’s terms don’t apply', () => {
    expect(legalLinks('android').map((l) => l.url)).toEqual([LegalUrls.PRIVACY]);
  });
});

describe('LegalLinks', () => {
  it('opens the privacy policy', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const ui = render(
      <ToastProvider>
        <LegalLinks />
      </ToastProvider>,
    );
    fireEvent.press(ui.getByText('Privacy Policy'));
    expect(open).toHaveBeenCalledWith(LegalUrls.PRIVACY);
    open.mockRestore();
  });

  it('says so when the page can’t be opened', async () => {
    const open = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValue(new Error('no browser'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const ui = render(
      <ToastProvider>
        <LegalLinks />
      </ToastProvider>,
    );
    fireEvent.press(ui.getByText('Privacy Policy'));
    expect(await ui.findByText("Couldn't open the page.")).toBeTruthy();
    open.mockRestore();
    warn.mockRestore();
  });
});
