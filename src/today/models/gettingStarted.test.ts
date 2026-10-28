import { startItems, StartItem } from './gettingStarted';

const fresh = {
  healthAvailable: true,
  healthConnected: false,
  stepGoalSet: false,
  remindersOn: false,
};

describe('startItems', () => {
  it('lists every setup step, none done, for a new install', () => {
    expect(startItems(fresh)).toEqual(
      Object.values(StartItem).map((item) => ({ item, done: false })),
    );
  });

  it('marks what has actually happened', () => {
    const rows = startItems({
      ...fresh,
      healthConnected: true,
      remindersOn: true,
    });
    expect(rows.filter((r) => r.done).map((r) => r.item)).toEqual([
      StartItem.ConnectHealth,
      StartItem.Reminders,
    ]);
  });

  it('leaves out the steps rows without a health app', () => {
    expect(
      startItems({ ...fresh, healthAvailable: false }).map((r) => r.item),
    ).toEqual([StartItem.Reminders]);
  });
});
