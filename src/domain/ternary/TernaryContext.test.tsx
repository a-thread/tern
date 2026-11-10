import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider, useSettings } from '../settings/SettingsContext';
import { WaypointsProvider, useWaypoints } from '../waypoints/WaypointsContext';
import { WaypointSource } from '../waypoints/models/waypoint';
import { Milestones } from '../waypoints/models/milestone';
import { JoinOutcome } from './models/ternary';
import {
  createMemoryTernaryRepository,
  sampleTernary,
  type TernaryRepository,
} from './ternary.repository';
import { TernaryProvider, useTernary } from './TernaryContext';

function setup(repo?: TernaryRepository) {
  const backend = createMemoryBackend();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <SettingsProvider repo={backend.settings}>
        <WaypointsProvider repo={backend.waypoints}>
          <TernaryProvider repo={repo}>{children}</TernaryProvider>
        </WaypointsProvider>
      </SettingsProvider>
    </ToastProvider>
  );
  return renderHook(
    () => ({ ternary: useTernary(), settings: useSettings(), waypoints: useWaypoints() }),
    { wrapper },
  );
}

describe('TernaryContext', () => {
  it('has nothing to offer on the phone, with no account', async () => {
    const { result } = setup(undefined);
    await waitFor(() => expect(result.current.ternary.ready).toBe(true));
    expect(result.current.ternary.available).toBe(false);
    expect(result.current.ternary.ternary).toBeNull();
  });

  it('starts a ternary of one', async () => {
    const { result } = setup(createMemoryTernaryRepository());
    await waitFor(() => expect(result.current.ternary.ready).toBe(true));
    await act(() => result.current.ternary.create('Sunday Walkers', 'Ari'));
    expect(result.current.ternary.ternary?.name).toBe('Sunday Walkers');
    expect(result.current.ternary.ternary?.members).toHaveLength(1);
  });

  it('joins by code, and says when a code matches nothing', async () => {
    const { result } = setup(createMemoryTernaryRepository());
    await waitFor(() => expect(result.current.ternary.ready).toBe(true));
    let outcome: JoinOutcome | undefined;
    await act(async () => {
      outcome = await result.current.ternary.join('NOPE00', 'Ari');
    });
    expect(outcome).toBe(JoinOutcome.NotFound);
    await act(async () => {
      outcome = await result.current.ternary.join('KTW4QP', 'Ari');
    });
    expect(outcome).toBe(JoinOutcome.Joined);
    expect(result.current.ternary.ternary?.members.find((m) => m.you)?.name).toBe('Ari');
  });

  it('only remembers the stop on the first look, paying nothing', async () => {
    const { result } = setup(createMemoryTernaryRepository(sampleTernary('2026-11-10')));
    await waitFor(() => expect(result.current.settings.settings.ternaryArrival).not.toBeNull());
    expect(result.current.settings.settings.ternaryArrival?.day).toBeNull();
    expect(
      result.current.waypoints.events.some((e) => e.source === WaypointSource.Arrival),
    ).toBe(false);
  });

  it('pays the arrival bonus when the shared bird reaches a new stop', async () => {
    let total = Milestones.STOPS[0].waypoints;
    const repo: TernaryRepository = {
      ...createMemoryTernaryRepository(),
      mine: async () => ({ ...sampleTernary('2026-11-10'), total }),
    };
    const { result } = setup(repo);
    await waitFor(() => expect(result.current.waypoints.ready).toBe(true));
    // The first look remembers the stop it's at.
    await waitFor(() =>
      expect(result.current.settings.settings.ternaryArrival?.stop).toBe(
        `1-${Milestones.STOPS[0].id}`,
      ),
    );
    total = Milestones.STOPS[1].waypoints;
    await act(() => result.current.ternary.reload());
    await waitFor(() =>
      expect(
        result.current.waypoints.events.some((e) => e.source === WaypointSource.Arrival),
      ).toBe(true),
    );
  });
});
