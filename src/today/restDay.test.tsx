import React from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMemoryBackend } from '@app/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { ViewedDayProvider, useViewedDay } from '@shared/state/ViewedDayContext';
import { addDays, dayKey } from '@shared/utils/date';
import { FoodProvider } from '@food/FoodContext';
import { createMemoryFoodRepository } from '@food/data/food.repository';
import { WaypointsProvider } from '@journey/WaypointsContext';
import { SettingsProvider } from '@settings/SettingsContext';
import { WeightProvider } from '@weight/WeightContext';
import { MedicationProvider } from '@medication/MedicationContext';
import { WaterProvider } from '@water/WaterContext';
import { MoodProvider } from '@mood/MoodContext';
import { MovementProvider } from '@movement/MovementContext';
import { ActivityProvider, useActivity } from '@today/ActivityContext';
import { StepsStatus, type StepsRepository } from '@today/data/steps.repository';
import { useRestDay } from '@today/hooks/useRestDay';
import { RestScenes } from '@today/models/restScene';
import TodayScreen from '@today/screens/TodayScreen';

// With reduce motion on nothing flies or loops, so the scene is easy to test: it is just
// there, or not.
jest.mock('@shared/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useIsFocused: () => true,
  // Runs its effect once mounted, as if the screen had just come into focus.
  useFocusEffect: (effect: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(() => effect(), [effect]);
  },
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** An empty food log, so there is something left to do, and a quiet day of steps (short of any goal). */
function quietBackend(restDays: string[] = []) {
  const steps: StepsRepository = {
    status: async () => StepsStatus.Connected,
    connect: async () => StepsStatus.Connected,
    getRange: async () => ({ [dayKey()]: 1200 }),
  };
  const backend = { ...createMemoryBackend(), food: createMemoryFoodRepository([]), steps };
  restDays.forEach((d) => backend.restDays.add(d));
  return backend;
}

function Providers({
  backend,
  children,
}: {
  backend: ReturnType<typeof quietBackend>;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <ViewedDayProvider>
              <FoodProvider repo={backend.food}>
                <WeightProvider repo={backend.weight}>
                  <MedicationProvider repo={backend.medication}>
                    <WaterProvider repo={backend.water}>
                      <MoodProvider repo={backend.mood}>
                        <MovementProvider repo={backend.movement}>
                          <ActivityProvider steps={backend.steps} restDays={backend.restDays}>
                            {children}
                          </ActivityProvider>
                        </MovementProvider>
                      </MoodProvider>
                    </WaterProvider>
                  </MedicationProvider>
                </WeightProvider>
              </FoodProvider>
            </ViewedDayProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

let activity: ReturnType<typeof useActivity>;
function Grab() {
  activity = useActivity();
  return null;
}

async function open(backend = quietBackend()) {
  const ui = render(
    <Providers backend={backend}>
      <Grab />
      <TodayScreen />
    </Providers>,
  );
  await waitFor(() => expect(activity?.ready).toBe(true));
  return ui;
}

describe('Today on a rest day', () => {
  it('is the usual screen until a rest day is taken', async () => {
    const ui = await open();
    await waitFor(() => expect(ui.getByText('Left to do')).toBeTruthy());
    expect(ui.queryByText('Rest day')).toBeNull();
    expect(ui.queryByText('Log something anyway')).toBeNull();
  });

  it('swaps the to-do list for the calm scene, with logging one tap away', async () => {
    const ui = await open();
    await waitFor(() => expect(ui.getByText('Left to do')).toBeTruthy());

    await act(async () => {
      activity.takeRestDay();
    });
    await waitFor(() => expect(ui.getByText('Rest day')).toBeTruthy());
    expect(ui.getByText('Your streak is safe. Nothing to log today.')).toBeTruthy();
    expect(ui.getByText('Reminders are quiet until tomorrow')).toBeTruthy();
    expect(ui.queryByText('Left to do')).toBeNull();
    expect(ui.queryByText('Nutrition today')).toBeNull();

    fireEvent.press(ui.getByText('Log something anyway'));
    await waitFor(() => expect(ui.getByText('Left to do')).toBeTruthy());
    expect(ui.queryByText('Log something anyway')).toBeNull();
    expect(ui.getByText('Rest day')).toBeTruthy(); // still resting
  });

  it('opens on the scene when today is already a rest day', async () => {
    const ui = await open(quietBackend([dayKey()]));
    await waitFor(() => expect(ui.getByText('Rest day')).toBeTruthy());
    expect(ui.queryByText('Left to do')).toBeNull();
  });

  it('goes back to the usual screen when the rest day is undone', async () => {
    const ui = await open();
    await act(async () => {
      activity.takeRestDay();
    });
    await waitFor(() => expect(ui.getByText('Rest day')).toBeTruthy());

    await act(async () => {
      activity.undoRestDay();
    });
    await waitFor(() => expect(ui.getByText('Left to do')).toBeTruthy());
    expect(ui.queryByText('Rest day')).toBeNull();
    expect(ui.queryByText('Log something anyway')).toBeNull();
  });
});

describe('useRestDay', () => {
  function setup(backend = quietBackend()) {
    return renderHook(
      () => ({ rest: useRestDay(), activity: useActivity(), viewed: useViewedDay() }),
      { wrapper: ({ children }) => <Providers backend={backend}>{children}</Providers> },
    );
  }
  type Setup = ReturnType<typeof setup>;
  const ready = (r: Setup) => waitFor(() => expect(r.result.current.activity.ready).toBe(true));

  it('has the tern fly in only when today has just become a rest day', async () => {
    const r = setup();
    await ready(r);
    expect(r.result.current.rest).toMatchObject({ isRest: false, showScene: false, entrance: false });

    await act(async () => {
      r.result.current.activity.takeRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(true));
    expect(r.result.current.rest).toMatchObject({ showScene: true, entrance: true, leaving: false });
  });

  it('holds the waypoints for resting until the tern has touched down', async () => {
    const r = setup();
    await ready(r);
    expect(r.result.current.rest.holdCelebrations).toBe(false);

    await act(async () => {
      r.result.current.activity.takeRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(true));
    expect(r.result.current.rest.holdCelebrations).toBe(true); // flying in

    act(() => r.result.current.rest.markTouchedDown());
    expect(r.result.current.rest.holdCelebrations).toBe(false); // landed: let them go
  });

  it('never keeps the waypoints waiting for long, whatever happens to the scene', async () => {
    const r = setup();
    await ready(r);
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    try {
      await act(async () => {
        r.result.current.activity.takeRestDay();
      });
      await waitFor(() => expect(r.result.current.rest.holdCelebrations).toBe(true));
      act(() => {
        jest.advanceTimersByTime(RestScenes.FLIGHT_MS + 999);
      });
      expect(r.result.current.rest.holdCelebrations).toBe(true);
      act(() => {
        jest.advanceTimersByTime(2);
      });
      expect(r.result.current.rest.holdCelebrations).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('holds nothing for a rest day that was already there, or for no rest day', async () => {
    const existing = setup(quietBackend([dayKey()]));
    await ready(existing);
    await waitFor(() => expect(existing.result.current.rest.isRest).toBe(true));
    expect(existing.result.current.rest.holdCelebrations).toBe(false);
  });

  it('starts holding again for a second rest day taken after undoing the first', async () => {
    const r = setup();
    await ready(r);
    await act(async () => {
      r.result.current.activity.takeRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(true));
    act(() => r.result.current.rest.markTouchedDown());
    await act(async () => {
      r.result.current.activity.undoRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(false));
    await act(async () => {
      r.result.current.activity.takeRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(true));
    expect(r.result.current.rest.holdCelebrations).toBe(true);
  });

  it('shows an existing rest day already settled', async () => {
    const r = setup(quietBackend([dayKey()]));
    await ready(r);
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(true));
    expect(r.result.current.rest.entrance).toBe(false);
  });

  it('keeps the scene up while the tern leaves after an undo', async () => {
    const r = setup();
    await ready(r);
    await act(async () => {
      r.result.current.activity.takeRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(true));

    await act(async () => {
      r.result.current.activity.undoRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(false));
    expect(r.result.current.rest).toMatchObject({ showScene: true, leaving: true });

    act(() => r.result.current.rest.finishLeaving());
    expect(r.result.current.rest).toMatchObject({ showScene: false, leaving: false });
  });

  it('stops the tern leaving when the rest day is taken again', async () => {
    const r = setup();
    await ready(r);
    await act(async () => {
      r.result.current.activity.takeRestDay();
    });
    await act(async () => {
      r.result.current.activity.undoRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.leaving).toBe(true));
    await act(async () => {
      r.result.current.activity.takeRestDay();
    });
    await waitFor(() => expect(r.result.current.rest.isRest).toBe(true));
    expect(r.result.current.rest.leaving).toBe(false);
  });

  it('does not fly the tern in when looking at another day', async () => {
    const r = setup();
    await ready(r);
    act(() => r.result.current.viewed.setDay(addDays(dayKey(), -1)));
    expect(r.result.current.rest.entrance).toBe(false);
    expect(r.result.current.rest.leaving).toBe(false);
  });
});
