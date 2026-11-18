import { useSettings } from '@/domain/settings/SettingsContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { useAuth } from '@/domain/auth/AuthContext';
import { StepsStatus } from '@/domain/activity/models/stepsStatus';
import { remindersOff } from '@/domain/settings/models/reminderPlan';
import { useWelcomeNavigation } from '@/navigation/useAppNavigation';
import { nextStep, wizardSteps, WizardStep } from '../models/wizardSteps';

/** Finishing drops the wizard's route, so the app lands on Today. */
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

  /** Without `askNotifications`, reminders are turned off so Settings never shows ones that can't fire. */
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

  /** By position, since `canGoBack` would also count the app's own stack. */
  const index = steps.indexOf(step);
  const back = index > 0 ? () => navigation.goBack() : null;

  /** Opening sign-up from the invitation doesn't settle it: backing out returns there. */
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
