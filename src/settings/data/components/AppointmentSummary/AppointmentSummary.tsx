import React, { useState } from 'react';
import { Share } from 'react-native';

import { FootNote, Group, Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { confirm } from '@shared/utils/confirm';
import { dayKey } from '@shared/utils/date';
import { useData } from '@/domain/settings/DataContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import {
  appointmentSummary,
  SummarySpan,
} from '../../models/appointmentSummary';

/**
 * A summary to bring to a dietitian, therapist or doctor: made on the phone from the log,
 * following the person's own display choices, and sent wherever they choose through the
 * share sheet. Free, like every safeguard: nobody pays to show their care team their log.
 */
export function AppointmentSummary() {
  const data = useData();
  const { settings } = useSettings();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const share = async (span: SummarySpan) => {
    setBusy(true);
    try {
      const text = appointmentSummary(
        await data.exportAll(),
        {
          trackFood: settings.trackFood,
          trackCalories: settings.trackCalories,
          showCalories: settings.showCalories,
          trackWeight: settings.trackWeight,
          trackMood: settings.trackMood,
          trackMovement: settings.trackMovement,
          units: settings.units,
        },
        span,
        dayKey(),
      );
      await Share.share({ title: 'Tern summary', message: text });
    } catch (e) {
      console.warn('Could not share a summary', e);
      toast.show("Couldn't make the summary — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const choose = () => {
    if (busy) return;
    confirm({
      title: 'Share a summary',
      message:
        'A plain summary of your meals and how they sat, with weight, mood and movement if you track them. It follows your display settings, and leaves out notes you wrote. You choose who it goes to.',
      action: 'Last 4 weeks',
      destructive: false,
      cancel: 'Not now',
      also: { text: 'Last 2 weeks', onPress: () => share(SummarySpan.TwoWeeks) },
      onConfirm: () => share(SummarySpan.FourWeeks),
    });
  };

  return (
    <>
      <Group>
        <Row
          title='Share a summary'
          sub='For a dietitian, therapist or doctor'
          chevron
          onPress={choose}
        />
      </Group>
      <FootNote>
        Made on this phone and sent only where you choose. Nothing is uploaded.
      </FootNote>
    </>
  );
}
