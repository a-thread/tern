import { act, renderHook, waitFor } from '@testing-library/react-native';

import { addDays, weekStartKey } from '@shared/utils/date';
import { Meal } from '@food/models/foodEntry';
import { Aim } from '@food/models/energyBalance';
import { useAdaptiveTarget } from './useAdaptiveTarget';

const TODAY = '2026-10-29';

const mockUpdate = jest.fn();
let mockSettings: Record<string, unknown>;
jest.mock('@shared/hooks/useDayKey', () => ({ useDayKey: () => '2026-10-29' }));
jest.mock('@settings/SettingsContext', () => ({
  useSettings: () => ({ settings: mockSettings, updateSettings: mockUpdate }),
}));

// Three weeks of 2,050 a day while the trend falls 1.2 lb: a burn of about 2,250.
const mockFood: Record<string, { meal: Meal; calories: number; servings: number }[]> = {};
for (let i = 1; i <= 30; i++) {
  mockFood[addDays(TODAY, -i)] = [
    { meal: Meal.Breakfast, calories: 615, servings: 1 },
    { meal: Meal.Lunch, calories: 615, servings: 1 },
    { meal: Meal.Dinner, calories: 820, servings: 1 },
  ];
}
const mockWeights = Array.from({ length: 45 }, (_, k) => {
  const i = 45 - k;
  return { id: `w${i}`, lb: 170 + (1.2 / 21) * (i - 1), loggedAt: `${addDays(TODAY, -i)}T12:00:00` };
}).reverse();
// Stable functions, like the real context's callbacks: new ones each render would reload forever.
const mockFoodContext = {
  foodLog: [],
  loadHistory: async () => mockFood,
  loadSkippedHistory: async () => ({}),
};
jest.mock('@food/FoodContext', () => ({ useFood: () => mockFoodContext }));
jest.mock('@weight/WeightContext', () => ({ useWeight: () => ({ weightEntries: mockWeights }) }));

beforeEach(() => {
  mockUpdate.mockReset();
  mockSettings = {
    trackCalories: true,
    trackWeight: true,
    adaptTarget: true,
    aim: Aim.LoseSlowly,
    calorieTarget: 2100,
    macroTargets: { protein: 131, carbs: 263, fat: 58 },
    lastSuggestionWeek: null,
  };
});

/** Renders the hook and lets its history load finish inside act. */
async function settle() {
  const hook = renderHook(() => useAdaptiveTarget());
  await act(async () => {});
  return hook;
}

describe('useAdaptiveTarget', () => {
  it('estimates the burn and offers a target for the aim', async () => {
    const { result } = await settle();
    await waitFor(() => expect(result.current.estimate?.status).toBe('ready'));
    expect(result.current.suggestion).toBe(2000);
    expect(result.current.offer).toBe(true);
  });

  it('uses the suggestion: new target, macros rescaled, and no more offers this week', async () => {
    const { result } = await settle();
    await waitFor(() => expect(result.current.offer).toBe(true));
    act(() => result.current.apply());
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ calorieTarget: 2000, lastSuggestionWeek: weekStartKey(TODAY) }),
    );
    const { macroTargets } = mockUpdate.mock.calls[0][0];
    expect(macroTargets.protein).toBeLessThan(131);
  });

  it('holds off after "Not now" until next week', async () => {
    mockSettings.lastSuggestionWeek = weekStartKey(TODAY);
    const { result } = await settle();
    await waitFor(() => expect(result.current.estimate?.status).toBe('ready'));
    expect(result.current.offer).toBe(false);
  });

  it('does nothing while off, and is unavailable without weight tracking', async () => {
    mockSettings.adaptTarget = false;
    const off = renderHook(() => useAdaptiveTarget());
    expect(off.result.current.on).toBe(false);
    expect(off.result.current.estimate).toBeNull();

    mockSettings = { ...mockSettings, adaptTarget: true, trackWeight: false };
    const noWeight = renderHook(() => useAdaptiveTarget());
    expect(noWeight.result.current.available).toBe(false);
    expect(noWeight.result.current.offer).toBe(false);
  });
});
