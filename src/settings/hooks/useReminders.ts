import { useSettings } from '@settings/SettingsContext';
import { describeReminders, type ReminderConfig } from '@settings/models/reminderPlan';

/** The reminder settings, the sentence describing each, and a way to change one reminder at a time. */
export function useReminders() {
  const { settings, updateSettings } = useSettings();
  const reminders = settings.reminders;

  const patch = <K extends keyof ReminderConfig>(key: K, change: Partial<ReminderConfig[K]>) =>
    updateSettings({ reminders: { ...reminders, [key]: { ...reminders[key], ...change } } });

  return {
    settings,
    updateSettings,
    reminders,
    text: describeReminders(reminders, settings.weighInFrequency),
    patch,
  };
}
