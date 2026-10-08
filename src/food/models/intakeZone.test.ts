import {
  defaultZone,
  MINIMUM_MARK,
  minimumFill,
  zoneStatus,
  macroFill,
  nudgeZone,
  resolveZone,
  sanitizeCalorieZone,
  zoneScale,
} from './intakeZone';

describe('intakeZone', () => {
  it('derives a snapped zone around the target', () => {
    expect(defaultZone(2000)).toEqual({ min: 1700, max: 2300 });
  });

  it('uses a saved zone before the default', () => {
    expect(resolveZone({ min: 1500, max: 2000 }, 2000)).toEqual({
      min: 1500,
      max: 2000,
    });
    expect(resolveZone(null, 2000)).toEqual({ min: 1700, max: 2300 });
  });

  it('rejects malformed saved zones', () => {
    expect(sanitizeCalorieZone(undefined)).toBeNull();
    expect(sanitizeCalorieZone({ min: 2000, max: 1900 })).toBeNull();
    expect(sanitizeCalorieZone({ min: 'a', max: 2000 })).toBeNull();
    expect(sanitizeCalorieZone({ min: 1500, max: 2000 })).toEqual({
      min: 1500,
      max: 2000,
    });
  });

  it('keeps a minimum gap when nudging ends', () => {
    const zone = { min: 1900, max: 2000 };
    expect(nudgeZone(zone, 'min', 1)).toEqual(zone);
    expect(nudgeZone(zone, 'max', -1)).toEqual(zone);
    expect(nudgeZone(zone, 'max', 1)).toEqual({ min: 1900, max: 2010 });
  });

  it('puts intake and the zone on one scale', () => {
    const { fill, zoneStart, zoneEnd } = zoneScale(326, {
      min: 1720,
      max: 2380,
    });
    expect(fill).toBeLessThan(zoneStart);
    expect(zoneEnd).toBeGreaterThan(zoneStart);
    expect(zoneEnd).toBeLessThanOrEqual(1);
  });

  it('caps macro fill at full', () => {
    expect(macroFill(150, 100)).toBe(1);
    expect(macroFill(50, 100)).toBe(0.5);
    expect(macroFill(10, 0)).toBe(0);
  });
});

describe('zoneStatus and minimumFill', () => {
  const zone = { min: 1700, max: 2300 };

  it('reports below, in and above the zone with the distance', () => {
    expect(zoneStatus(1013, zone)).toEqual({ kind: 'below', amount: 687 });
    expect(zoneStatus(2000, zone)).toEqual({ kind: 'in' });
    expect(zoneStatus(2450, zone)).toEqual({ kind: 'above', amount: 150 });
  });

  it('puts a minimum target at the mark and keeps filling past it', () => {
    expect(minimumFill(100, 100)).toBeCloseTo(MINIMUM_MARK);
    expect(minimumFill(125, 100)).toBe(1);
    expect(minimumFill(50, 100)).toBeCloseTo(MINIMUM_MARK / 2);
    expect(minimumFill(10, 0)).toBe(0);
  });
});
