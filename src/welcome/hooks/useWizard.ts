import { useSettings } from '@/domain/settings/SettingsContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { useAuth } from '@/domain/auth/AuthContext';
import { StepsStatus } from '@/domain/activity/models/stepsStatus';
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
    trackCalories: settings.trackCalories,
    trackMacros: settings.trackMacros,
    showCalories: settings.showCalories,
    showIntakeBars: settings.showIntakeBars,
    // Only where accounts exist (not sample builds), and once: any answer settles it.
    offerAccount:
      auth !== null && !auth.session && !settings.onboarding.accountOffered,
  };
  const steps = wizardSteps(input);

  /** `askNotifications`: reminders were chosen, so the phone may ask to send them now. */
  const finish = (askNotifications = false) =>
    updateSettings({
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

  return { steps, index: steps.indexOf(step), next, finish, answerAccount };
}
