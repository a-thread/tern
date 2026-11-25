import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@shared/theme';
import { Group } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { confirm } from '@shared/utils/confirm';
import { dayKey, formatLongDate } from '@shared/utils/date';
import { useHealthConsent } from '@/domain/consent/HealthConsentContext';

/** Only while the account syncs: withdrawing is as easy as agreeing was. */
export function ConsentSection() {
  const consent = useHealthConsent();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!consent) return null;

  const since = formatLongDate(dayKey(new Date(consent.given.consentedAt)));
  const withdraw = () => {
    if (busy) return;
    confirm({
      title: 'Withdraw consent?',
      message:
        "Tern stops syncing and keeps your log on this phone. Your account's copy on the server is erased. Your account and Tern Plus stay, and you can agree again later.",
      action: 'Withdraw',
      onConfirm: async () => {
        setBusy(true);
        try {
          await consent.withdraw();
        } catch (e) {
          console.warn('Could not withdraw health data consent', e);
          toast.show("Couldn't withdraw consent — please try again.");
          setBusy(false);
        }
      },
    });
  };

  return (
    <Group>
      <Pressable
        style={s.row}
        onPress={withdraw}
        disabled={busy}
        accessibilityRole='button'
        accessibilityLabel={`Health data consent, given ${since}. Withdraw`}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Withdraw consent</Text>
          <Text style={s.sub}>
            {`You agreed on ${since} to keep your health data in your account`}
          </Text>
        </View>
      </Pressable>
    </Group>
  );
}

const s = StyleSheet.create({
  row: { paddingHorizontal: 13, paddingVertical: 12 },
  title: { ...typography.rowTitle, color: colors.danger },
  sub: { ...typography.caption, marginTop: 2, lineHeight: 16 },
});
