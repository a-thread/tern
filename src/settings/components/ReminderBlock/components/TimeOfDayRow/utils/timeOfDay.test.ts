import {
  clockParts,
  Meridiem,
  stepHour,
  stepMinute,
  withMeridiem,
  withTypedHour,
  withTypedMinute,
} from './timeOfDay';

const at = (h: number, m = 0) => h * 60 + m;

describe('clockParts', () => {
  it('reads midnight, noon and an evening time on a 12-hour clock', () => {
    expect(clockParts(0)).toEqual({
      hour: 12,
      minute: 0,
      meridiem: Meridiem.Am,
    });
    expect(clockParts(at(12))).toEqual({
      hour: 12,
      minute: 0,
      meridiem: Meridiem.Pm,
    });
    expect(clockParts(at(20, 30))).toEqual({
      hour: 8,
      minute: 30,
      meridiem: Meridiem.Pm,
    });
  });
});

describe('withMeridiem', () => {
  it('turns 8 am into 8 pm in one go', () => {
    expect(withMeridiem(at(8), Meridiem.Pm)).toBe(at(20));
    expect(withMeridiem(at(20), Meridiem.Am)).toBe(at(8));
    expect(withMeridiem(at(12, 15), Meridiem.Am)).toBe(at(0, 15));
  });
});

describe('stepHour', () => {
  it('moves an hour and keeps the minutes, crossing noon and midnight', () => {
    expect(stepHour(at(8, 30), 1)).toBe(at(9, 30));
    expect(stepHour(at(20), -1)).toBe(at(19));
    expect(stepHour(at(11), 1)).toBe(at(12));
    expect(stepHour(at(12), -1)).toBe(at(11));
    expect(stepHour(at(23, 15), 1)).toBe(at(0, 15));
    expect(stepHour(at(0), -1)).toBe(at(23));
  });
});

describe('stepMinute', () => {
  it('moves to the next mark inside the hour', () => {
    expect(stepMinute(at(8), 1, 15)).toBe(at(8, 15));
    expect(stepMinute(at(8, 45), 1, 15)).toBe(at(8));
    expect(stepMinute(at(8), -1, 15)).toBe(at(8, 45));
    expect(stepMinute(at(8, 7), 1, 15)).toBe(at(8, 15));
    expect(stepMinute(at(8, 7), -1, 15)).toBe(at(8));
  });
});

describe('typed values', () => {
  it('takes an hour from 1 to 12 and keeps am / pm', () => {
    expect(withTypedHour(at(20, 30), '9')).toBe(at(21, 30));
    expect(withTypedHour(at(8), '12')).toBe(at(0));
    expect(withTypedHour(at(8), '13')).toBeNull();
    expect(withTypedHour(at(8), '0')).toBeNull();
    expect(withTypedHour(at(8), '')).toBeNull();
  });

  it('takes minutes from 0 to 59', () => {
    expect(withTypedMinute(at(20), '05')).toBe(at(20, 5));
    expect(withTypedMinute(at(20), '60')).toBeNull();
    expect(withTypedMinute(at(20), 'x')).toBeNull();
  });
});
