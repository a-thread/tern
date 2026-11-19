import React from 'react';
import { Linking, Share, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CrashBoundary from './CrashBoundary';
import { installFatalHandler, resetFatalHandlerForTests } from '../../fatalErrors';

let broken = true;
function Flaky() {
  if (broken) throw new Error('rows is undefined');
  return <Text>Today</Text>;
}

function renderBoundary(children: React.ReactNode) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <CrashBoundary>{children}</CrashBoundary>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  broken = true;
  resetFatalHandlerForTests();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

it('shows the crash screen for a render error, and Try again remounts', () => {
  renderBoundary(<Flaky />);
  expect(screen.getByText('Something went wrong')).toBeTruthy();
  expect(screen.getByText('rows is undefined')).toBeTruthy();

  broken = false;
  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(screen.getByText('Today')).toBeTruthy();
});

it('Send details opens an email with the report, or the share sheet without a mail app', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(undefined);
  const share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
  renderBoundary(<Flaky />);

  fireEvent.press(screen.getByRole('button', { name: 'Send details' }));
  await waitFor(() => expect(openURL).toHaveBeenCalledTimes(1));
  expect(openURL.mock.calls[0][0]).toMatch(/^mailto:.+\?subject=.+&body=.*rows%20is%20undefined/);
  expect(share).not.toHaveBeenCalled();

  openURL.mockRejectedValueOnce(new Error('no handler'));
  fireEvent.press(screen.getByRole('button', { name: 'Send details' }));
  await waitFor(() =>
    expect(share).toHaveBeenCalledWith({ message: expect.stringContaining('rows is undefined') }),
  );
});

it('shows a fatal error from outside render instead of the default crash', () => {
  let handler: (e: unknown, fatal?: boolean) => void = () => {};
  const fallback = jest.fn();
  installFatalHandler(
    { getGlobalHandler: () => fallback, setGlobalHandler: (h) => (handler = h) },
    false,
  );
  renderBoundary(<Text>Today</Text>);

  act(() => handler(new TypeError('x is not a function'), true));
  expect(screen.getByText('x is not a function')).toBeTruthy();
  expect(fallback).not.toHaveBeenCalled();

  act(() => handler(new Error('soft'), false));
  expect(fallback).toHaveBeenCalledWith(expect.any(Error), false);
});

it('leaves the default handler alone in dev', () => {
  const setGlobalHandler = jest.fn();
  installFatalHandler({ getGlobalHandler: () => jest.fn(), setGlobalHandler }, true);
  expect(setGlobalHandler).not.toHaveBeenCalled();
});
