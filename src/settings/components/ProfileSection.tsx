import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, font, typography } from '@shared/theme';
import { Chevron, Group } from '@shared/components/ui';
import { useAuth } from '../../domain/auth/AuthContext';
import { AccountLimits } from '../../domain/auth/validation';
import { useSettings } from '../../domain/settings/SettingsContext';
import { logHome } from '../models/logHome';
import { usePlusLapsed } from '../hooks/usePlusLapsed';
import { LogHomeMark } from './LogHomeMark/LogHomeMark';

/**
 * The top of Settings. Without an account it says the data is on this phone and offers to
 * sign in or make an account (the sign-in screen has both). With one, it's who is signed
 * in: an avatar marked with where the data is (synced, or back on the phone once Tern Plus
 * has ended), the first name (editable) and the email.
 */
export function ProfileSection() {
  const auth = useAuth();
  if (auth && !auth.session) return <PhoneOnlyCard onPress={() => auth.openSignIn()} />;
  return <SignedInCard />;
}

function PhoneOnlyCard({ onPress }: { onPress: () => void }) {
  return (
    <Group style={{ marginTop: 4 }}>
      <Pressable
        style={s.row}
        onPress={onPress}
        android_ripple={{ color: colors.doveTint }}
        accessibilityRole='button'
        accessibilityLabel='Saved on phone only. Sign in or create an account'
      >
        <View style={[s.avatar, { backgroundColor: colors.driftwoodTint }]}>
          <MaterialCommunityIcons name='cellphone-check' size={20} color={colors.driftwood} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.rowTitle}>Saved on phone only</Text>
          <Text style={[s.sub, s.link]}>Sign in or create an account</Text>
        </View>
        <Chevron />
      </Pressable>
    </Group>
  );
}

/** Signed in, or the sample data (no accounts at all), which keeps the plain name field. */
function SignedInCard() {
  const { settings, updateSettings } = useSettings();
  const auth = useAuth();
  const lapsed = usePlusLapsed();
  const email = auth?.session?.user.email;

  // Edited locally and saved on blur, so each keystroke isn't a settings write.
  const [name, setName] = useState(settings.firstName);
  useEffect(() => setName(settings.firstName), [settings.firstName]);
  const saveName = () => {
    const trimmed = name.trim();
    setName(trimmed);
    if (trimmed !== settings.firstName) updateSettings({ firstName: trimmed });
  };

  return (
    <Group style={{ marginTop: 4 }}>
      <View style={s.row}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {(name.trim() || email || '?')[0].toUpperCase()}
          </Text>
          {auth?.session ? (
            // On the avatar rather than after the name: the name is a text field, which
            // doesn't size to its text, so a mark after it would drift with the field.
            <LogHomeMark home={logHome({ signedIn: true, lapsed })} variant='corner' />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={saveName}
            onSubmitEditing={saveName}
            placeholder='First name'
            placeholderTextColor={colors.ink3}
            maxLength={AccountLimits.MAX_NAME_LENGTH}
            autoCapitalize='words'
            autoComplete='given-name'
            returnKeyType='done'
            accessibilityLabel='First name'
            style={s.nameInput}
          />
          <Text style={s.sub}>{email ?? 'Sample data · nothing is saved'}</Text>
        </View>
      </View>
    </Group>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.water,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.semibold, fontSize: 15, color: '#EAF2F4' },
  nameInput: { ...typography.rowTitle, padding: 0 },
  sub: { ...typography.caption, marginTop: 2, lineHeight: 16 },
  link: { fontFamily: font.semibold, color: colors.water },
});
