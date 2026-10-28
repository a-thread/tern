import { useSettings } from '@/domain/settings/SettingsContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { useAuth } from '@/domain/auth/AuthContext';
import { StepsStatus } from '@/domain/activity/models/stepsStatus';
import { remindersOff } from '@/domain/settings/models/reminderPlan';
import { useWelcomeNavigation } from '@/navigation/useAppNavigation';
import { nextStep, wizardSteps, WizardStep } from '../models/wizardSteps';

/**
 * Where a wizard screen sits and how to leave it: on to the next screen that applies (worked
 * out from what has been chosen so far), or finished. Finishing drops the wizard's route, so
 * the app lands on Today.
 */
export function useWizard(step: WizardStep) {
  const navigation = useWelcomeNavigation();
  const { settings, updateSettings } = useSettings();
  const { status } = useActivity();
  const auth = useAuth();
  const input = {
    healthAvailable: status !== StepsStatus.Unavailable,
    trackFood: settings.trackFood,
    trackWeight: settings.trackWeight,
    trackCalories: settings.trackCalories,
    trackMacros: settings.trackMacros,
    showCalories: settings.showCalories,
    showIntakeBars: settings.showIntakeBars,
    // Only where accounts exist (not sample builds), and once: any answer settles it.
    offerAccount:
      auth !== null && !auth.session && !settings.onboarding.accountOffered,
  };
  const steps = wizardSteps(input);

  /**
   * `askNotifications`: reminders were chosen, so the phone may ask to send them now. Finishing
   * without ("Not now", or skipping setup) turns the reminders off, so Settings never shows
   * reminders as on that can't fire; turning one on later asks then.
   */
  const finish = (askNotifications = false) =>
    updateSettings({
      ...(askNotifications || settings.onboarding.notificationsAsked
        ? {}
        : { reminders: remindersOff(settings.reminders) }),
      onboarding: {
        ...settings.onboarding,
        wizardDone: true,
        notificationsAsked:
          settings.onboarding.notificationsAsked || askNotifications,
      },
    });

  const next = () => {
    const to = nextStep(step, input);
    if (to) navigation.navigate(to);
    else finish();
  };

  /**
   * The screen before, as swiping back or Android's back button would. None on the first
   * screen: going by position, since `canGoBack` would also count the app's own stack.
   */
  const index = steps.indexOf(step);
  const back = index > 0 ? () => navigation.goBack() : null;

  /**
   * Settles the account invitation for good: "Keep on this phone" on its own screen (which
   * then moves on), or signing in from the first screen. Opening sign-up or sign-in from the
   * invitation itself doesn't settle it: backing out of those lands on the same screen, and
   * making an account removes the invitation anyway.
   */
  const answerAccount = (signIn?: () => void) => {
    updateSettings({
      onboarding: { ...settings.onboarding, accountOffered: true },
    });
    if (step === WizardStep.Account) next();
    signIn?.();
  };

  return {
    steps,
    index,
    next,
    back,
    finish,
    answerAccount,
  };
}
