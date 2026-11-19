import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { colors, font, radius, space, typography } from '@shared/theme';
import { Contact } from '@shared/models/contact';
import { crashEmailUrl, crashReport } from './utils/crashReport';
import RestingTern from './components/RestingTern/RestingTern';

/** Drawn outside every provider, since one of them may be what broke. */
export default function CrashScreen({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const insets = useSafeAreaInsets();
  const send = async () => {
    const version = Constants.expoConfig?.version ?? 'unknown';
    const report = crashReport(error, {
      version,
      platform: `${Platform.OS} ${Platform.Version}`,
      at: new Date(),
    });
    try {
      await Linking.openURL(crashEmailUrl(Contact.EMAIL, version, report));
    } catch {
      // No mail app: let them pick another way to send it.
      await Share.share({ message: report }).catch(() => undefined);
    }
  };

  return (
    <View
      style={[
        s.root,
        {
          paddingTop: insets.top + space.xxl,
          paddingBottom: insets.bottom + space.lg,
        },
      ]}
    >
      <View style={s.body}>
        <View style={s.art}>
          <RestingTern />
        </View>
        <Text style={s.title} accessibilityRole='header'>
          Something went wrong
        </Text>
        <Text style={s.text}>
          Tern ran into an error. Anything you had already saved is still there.
          Sending the details helps get it fixed.
        </Text>
        {error?.message?.length > 0 && (
          <Text style={s.detail} numberOfLines={3}>
            {error?.message}
          </Text>
        )}
      </View>
      <Pressable onPress={onRetry} style={s.primary} accessibilityRole='button'>
        <Text style={s.primaryText}>Try again</Text>
      </Pressable>
      <Pressable
        onPress={send}
        hitSlop={8}
        style={s.secondary}
        accessibilityRole='button'
      >
        <Text style={s.secondaryText}>Send details</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: space.lg,
  },
  body: { flex: 1, justifyContent: 'center', gap: space.sm },
  art: { marginBottom: space.lg },
  title: { ...typography.screenTitle, fontSize: 26, lineHeight: 32 },
  text: { ...typography.meta, lineHeight: 19 },
  detail: { ...typography.caption, marginTop: space.sm },
  primary: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.onAction,
  },
  secondary: { alignItems: 'center', paddingTop: space.md },
  secondaryText: {
    fontFamily: font.medium,
    fontSize: 13.5,
    color: colors.ink2,
  },
});
