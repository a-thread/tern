import { restDetail, restReminderNote } from './restDetail';

describe('restDetail', () => {
  it('shows the steps and the streak', () => {
    expect(restDetail(2310, 9)).toBe('2,310 steps · ☀ 9 days');
  });

  it('says day for a streak of one', () => {
    expect(restDetail(500, 1)).toBe('500 steps · ☀ 1 day');
  });

  it('leaves the sun out without a streak', () => {
    expect(restDetail(0, 0)).toBe('0 steps');
  });

  it('leaves steps out while they can not be read', () => {
    expect(restDetail(null, 3)).toBe('☀ 3 days');
    expect(restDetail(null, 0)).toBe('');
  });
});

describe('restReminderNote', () => {
  const none = {
    meals: false,
    weighIn: false,
    water: false,
    mood: false,
    streak: false,
    medication: false,
  };

  it('says nothing when no reminder would have fired', () => {
    expect(restReminderNote(none)).toBeUndefined();
    expect(restReminderNote({ ...none, medication: true })).toBeUndefined();
  });

  it('names medication as the one that stays on', () => {
    expect(restReminderNote({ ...none, meals: true })).toBe(
      'Reminders are quiet until tomorrow',
    );
    expect(restReminderNote({ ...none, meals: true, medication: true })).toBe(
      'Reminders are quiet until tomorrow, except medication',
    );
  });
});
