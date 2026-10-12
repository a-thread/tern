import {
  gramRange,
  isValidSplit,
  macrosFromPercents,
  matchPreset,
  percentsFromMacros,
  rescaleMacros,
  MacroSplits,
} from './macroSplit';

describe('macroSplit', () => {
  it('turns percents into grams at 4/4/9 kcal per gram', () => {
    expect(
      macrosFromPercents(2000, { protein: 25, carbs: 50, fat: 25 }),
    ).toEqual({ protein: 125, carbs: 250, fat: 56 });
  });

  it('always returns percents that add to 100', () => {
    const p = percentsFromMacros({ protein: 119, carbs: 253, fat: 62 });
    expect(p.protein + p.carbs + p.fat).toBe(100);
  });

  it('round-trips a preset', () => {
    const split = { protein: 30, carbs: 40, fat: 30 };
    expect(percentsFromMacros(macrosFromPercents(2100, split))).toEqual(split);
  });

  it('matches presets within tolerance and returns null for custom', () => {
    expect(matchPreset({ protein: 23, carbs: 50, fat: 27 })?.key).toBe(
      'balanced',
    );
    expect(matchPreset({ protein: 30, carbs: 25, fat: 45 })?.key).toBe(
      'lowerCarb',
    );
    expect(matchPreset({ protein: 40, carbs: 30, fat: 30 })).toBeNull();
  });

  it('validates sum to 100 and a minimum share', () => {
    expect(isValidSplit({ protein: 35, carbs: 25, fat: 40 })).toBe(true);
    expect(isValidSplit({ protein: 35, carbs: 25, fat: 35 })).toBe(false);
    expect(isValidSplit({ protein: 5, carbs: 55, fat: 40 })).toBe(false);
  });

  it('keeps percentages when the calorie target changes', () => {
    const grams = macrosFromPercents(2000, { protein: 30, carbs: 40, fat: 30 });
    const scaled = rescaleMacros(grams, 2000, 1800);
    expect(percentsFromMacros(scaled)).toEqual({
      protein: 30,
      carbs: 40,
      fat: 30,
    });
  });

  it('gives a gram range around a macro target', () => {
    expect(gramRange(2000, 25, 'protein')).toEqual({ low: 100, high: 150 });
    expect(MacroSplits.STEP).toBe(5);
  });
});
