import {
  formatVolume,
  formatWeight,
  fromDisplayVolume,
  fromDisplayWeight,
  kgToLb,
  lbToKg,
  mlToOz,
  ozToMl,
  quickWaterOz,
  roundOz,
  stepWaterGoal,
  toDisplayVolume,
  toDisplayWeight,
} from './units';

describe('units', () => {
  it('converts between kg and lb', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 2);
    expect(lbToKg(220.462)).toBeCloseTo(100, 2);
  });

  it('leaves pounds alone in imperial', () => {
    expect(toDisplayWeight(172.4, 'imperial')).toBe(172.4);
    expect(fromDisplayWeight(172.4, 'imperial')).toBe(172.4);
  });

  it('round-trips a kilogram value through lb storage', () => {
    for (const kg of [54, 68.3, 78.2, 90.1]) {
      const lb = fromDisplayWeight(kg, 'metric');
      expect(toDisplayWeight(lb, 'metric')).toBeCloseTo(kg, 1);
    }
  });

  it('formats stored pounds in the chosen unit', () => {
    expect(formatWeight(172.4, 'imperial')).toBe('172.4 lb');
    expect(formatWeight(172.4, 'metric')).toBe('78.2 kg');
  });
});

describe('volume', () => {
  it('converts between US fluid ounces and millilitres', () => {
    expect(ozToMl(8)).toBeCloseTo(236.6, 1);
    expect(mlToOz(250)).toBeCloseTo(8.45, 2);
    expect(roundOz(8.4535)).toBe(8.45);
  });

  it('leaves ounces alone in imperial, apart from showing them whole', () => {
    expect(toDisplayVolume(8, 'imperial')).toBe(8);
    expect(fromDisplayVolume(8, 'imperial')).toBe(8);
    expect(fromDisplayVolume(12.5, 'imperial')).toBe(12.5);
    expect(toDisplayVolume(8.45, 'imperial')).toBe(8);
  });

  it('shows metric to the nearest 10 ml, so a drink entered in ml reads the same again', () => {
    for (const ml of [150, 250, 350, 500, 750, 1000]) {
      expect(toDisplayVolume(fromDisplayVolume(ml, 'metric'), 'metric')).toBe(ml);
    }
    expect(toDisplayVolume(64, 'metric')).toBe(1890);
  });

  it('formats for each unit system', () => {
    expect(formatVolume(64, 'imperial')).toBe('64 oz');
    expect(formatVolume(fromDisplayVolume(2000, 'metric'), 'metric')).toBe('2,000 ml');
    expect(formatVolume(0, 'imperial')).toBe('0 oz');
  });

  it('offers quick sizes in stored ounces', () => {
    expect(quickWaterOz('imperial')).toEqual([8, 12, 16]);
    expect(quickWaterOz('metric').map((oz) => toDisplayVolume(oz, 'metric'))).toEqual([250, 350, 500]);
  });

  it('steps the goal 8 oz at a time, or 250 ml at a time from a tidy number', () => {
    expect(stepWaterGoal(64, 1, 'imperial')).toBe(72);
    expect(stepWaterGoal(64, -1, 'imperial')).toBe(56);
    // 64 oz is 1,893 ml: the first metric step lands on a round number.
    expect(toDisplayVolume(stepWaterGoal(64, 1, 'metric'), 'metric')).toBe(2250);
    expect(toDisplayVolume(stepWaterGoal(64, -1, 'metric'), 'metric')).toBe(1750);
    const twice = stepWaterGoal(stepWaterGoal(64, 1, 'metric'), 1, 'metric');
    expect(toDisplayVolume(twice, 'metric')).toBe(2500);
  });
});
