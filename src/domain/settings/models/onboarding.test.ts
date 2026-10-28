import { loadOnboarding, Onboarding, Tip } from './onboarding';

describe('loadOnboarding', () => {
  it('starts a new install at the beginning', () => {
    expect(loadOnboarding(undefined, false)).toEqual(Onboarding.NEW);
  });

  it('treats settings saved before onboarding existed as done', () => {
    expect(loadOnboarding(undefined, true)).toEqual(Onboarding.DONE);
    expect(loadOnboarding('nonsense', true)).toEqual(Onboarding.DONE);
  });

  it('keeps saved progress', () => {
    expect(
      loadOnboarding(
        {
          wizardDone: true,
          tipsSeen: [Tip.WeekStrip],
          checklistHidden: false,
          notificationsAsked: false,
          accountOffered: false,
        },
        true,
      ),
    ).toEqual({
      wizardDone: true,
      tipsSeen: [Tip.WeekStrip],
      checklistHidden: false,
      notificationsAsked: false,
      accountOffered: false,
    });
  });

  it('fills malformed fields with "done" and drops unknown tips', () => {
    expect(
      loadOnboarding(
        { wizardDone: 'yes', tipsSeen: ['weekStrip', 'other'] },
        true,
      ),
    ).toEqual({
      wizardDone: true,
      tipsSeen: [Tip.WeekStrip],
      checklistHidden: true,
      notificationsAsked: true,
      accountOffered: true,
    });
  });
});
