import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { space } from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import { LinkButton } from '@/auth/components/LinkButton';
import { legalLinks } from './utils/legalLinks';

/** The terms and privacy links under the paywall's fine print, side by side. */
export function LegalLinks() {
  const toast = useToast();

  const open = (url: string) =>
    Linking.openURL(url).catch((e) => {
      console.warn('Could not open a legal page', e);
      toast.show("Couldn't open the page.");
    });

  return (
    <View style={s.row}>
      {legalLinks().map(({ label, url }) => (
        <LinkButton key={url} label={label} onPress={() => open(url)} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.lg,
    marginTop: space.sm,
  },
});
