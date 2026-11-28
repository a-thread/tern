import React from 'react';
import { Share } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import { createMemoryTernaryRepository } from '@/domain/ternary/ternary.repository';
import { sampleTernary } from '@/domain/ternary/ternary.mock';
import type { Ternary } from '@/domain/ternary/models/ternary';
import { InviteCard } from './InviteCard';

function open(ternary: Ternary) {
  const backend = createMemoryBackend();
  render(
    <SettingsProvider repo={backend.settings}>
      <WaypointsProvider repo={backend.waypoints}>
        <TernaryProvider repo={createMemoryTernaryRepository(ternary)}>
          <InviteCard />
        </TernaryProvider>
      </WaypointsProvider>
    </SettingsProvider>,
  );
}

describe('InviteCard', () => {
  const share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
  beforeEach(() => share.mockClear());

  it('shows your code while it’s just you, and shares it', async () => {
    const sample = sampleTernary('2026-11-27');
    open({ ...sample, members: sample.members.filter((m) => m.you) });
    expect(await screen.findByText('KTW4QP')).toBeTruthy();
    fireEvent.press(screen.getByText('Share invite'));
    expect(share).toHaveBeenCalledWith({
      message: expect.stringContaining('the code KTW4QP'),
    });
  });

  it('goes once a friend has joined', async () => {
    open(sampleTernary('2026-11-27'));
    // Let the ternary load, so the card has had its chance to show.
    await act(async () => {});
    expect(screen.queryByText('Share invite')).toBeNull();
  });
});
