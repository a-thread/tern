import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font } from '@shared/theme';
import { Group } from '@shared/components/ui';
import { useAuth } from '@shared/auth/AuthContext';
import { AccountLimits } from '@shared/auth/validation';
import { useSettings } from '@settings/SettingsContext';

/** Who is signed in: an avatar, the first name (editable) and the account line. */
export function ProfileSection() {
  const { settings, updateSettings } = useSettings();
  const auth = useAuth();
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
          <Text style={s.avatarText}>{(name.trim() || email || '?')[0].toUpperCase()}</Text>
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
          <Text style={s.sub}>
            {auth?.isGuest
              ? 'Preview · nothing is saved, this resets when you exit'
              : (email ?? 'Local profile')}
          </Text>
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
  nameInput: { fontFamily: font.medium, fontSize: 14, color: colors.ink, padding: 0 },
  sub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2, marginTop: 2, lineHeight: 16 },
});
