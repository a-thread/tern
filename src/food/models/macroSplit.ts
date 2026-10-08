export type MacroGrams = { protein: number; carbs: number; fat: number };

/** A split of calories between the three macros, in whole percents. */
export type MacroSplit = { protein: number; carbs: number; fat: number };

export type MacroKey = keyof MacroSplit;

export type MacroPreset = {
  key: 'balanced' | 'higherProtein' | 'lowerCarb';
  name: string;
  sub: string;
  split: MacroSplit;
};

export class MacroSplits {
  static readonly KEYS: readonly MacroKey[] = ['protein', 'carbs', 'fat'];
  static readonly KCAL_PER_GRAM: Record<MacroKey, number> = {
    protein: 4,
    carbs: 4,
    fat: 9,
  };
  static readonly STEP = 5;
  static readonly MIN_PERCENT = 10;
  static readonly MAX_PERCENT = 70;
  /** How far each macro can sit from a preset and still read as that preset. */
  static readonly MATCH_TOLERANCE = 2;
  static readonly PRESETS: readonly MacroPreset[] = [
    {
      key: 'balanced',
      name: 'Balanced',
      sub: 'Steady energy and fullness',
      split: { protein: 25, carbs: 50, fat: 25 },
    },
    {
      key: 'higherProtein',
      name: 'Higher protein',
      sub: 'Helps you feel fuller for longer',
      split: { protein: 30, carbs: 40, fat: 30 },
    },
    {
      key: 'lowerCarb',
      name: 'Lower carb',
      sub: 'Steadier meal satisfaction',
      split: { protein: 30, carbs: 25, fat: 45 },
    },
  ];
}

export function macrosFromPercents(
  calories: number,
  split: MacroSplit,
): MacroGrams {
  const grams = (key: MacroKey) =>
    Math.round(
      (calories * split[key]) / 100 / MacroSplits.KCAL_PER_GRAM[key],
    );
  return { protein: grams('protein'), carbs: grams('carbs'), fat: grams('fat') };
}

/** Whole percents that always add to 100 (largest remainder), from macro grams. */
export function percentsFromMacros(grams: MacroGrams): MacroSplit {
  const kcal = MacroSplits.KEYS.map(
    (k) => grams[k] * MacroSplits.KCAL_PER_GRAM[k],
  );
  const total = kcal.reduce((a, b) => a + b, 0);
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  const exact = kcal.map((v) => (v / total) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return { protein: floors[0], carbs: floors[1], fat: floors[2] };
}

/** The preset a split reads as, or null when it's a custom split. */
export function matchPreset(split: MacroSplit): MacroPreset | null {
  return (
    MacroSplits.PRESETS.find((p) =>
      MacroSplits.KEYS.every(
        (k) => Math.abs(p.split[k] - split[k]) <= MacroSplits.MATCH_TOLERANCE,
      ),
    ) ?? null
  );
}

export function splitTotal(split: MacroSplit): number {
  return split.protein + split.carbs + split.fat;
}

export function isValidSplit(split: MacroSplit): boolean {
  return (
    splitTotal(split) === 100 &&
    MacroSplits.KEYS.every((k) => split[k] >= MacroSplits.MIN_PERCENT)
  );
}

/** Keeps each macro's share of calories when the calorie target changes. */
export function rescaleMacros(
  grams: MacroGrams,
  fromCalories: number,
  toCalories: number,
): MacroGrams {
  if (fromCalories <= 0) return grams;
  const ratio = toCalories / fromCalories;
  return {
    protein: Math.round(grams.protein * ratio),
    carbs: Math.round(grams.carbs * ratio),
    fat: Math.round(grams.fat * ratio),
  };
}

/** A ±range around a macro's gram target (5% either side of its calorie share). */
export function gramRange(
  calories: number,
  percent: number,
  key: MacroKey,
): { low: number; high: number } {
  const per = MacroSplits.KCAL_PER_GRAM[key];
  return {
    low: Math.round((calories * Math.max(percent - 5, 0)) / 100 / per),
    high: Math.round((calories * (percent + 5)) / 100 / per),
  };
}
