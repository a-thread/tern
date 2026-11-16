import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { font, space, typography } from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import { AboutLinks } from '@/settings/about/models/aboutLinks';
import { LetterLink } from '../LetterLink/LetterLink';

/** The letter after its first paragraph: the rest, the sign-off, and its two links. */
export function LetterRest() {
  const toast = useToast();

  const open = (url: string, what: string) =>
    Linking.openURL(url).catch((e) => {
      console.warn(`Could not open ${what}`, e);
      toast.show(`Couldn't open ${what}.`);
    });

  return (
    <>
      <Text style={s.para}>
        With feedback from my partner, I added safeguards for other traps around
        food and movement, and more ways to keep notes.
      </Text>
      <Text style={s.para}>
        My hope is that Tern itself stays free, with Tern Plus covering the
        account and syncing, so people like us can keep flying toward our goals,
        and past them.
      </Text>
      <Text style={s.para}>
        If you’re a programmer, or just curious, the source code is on GitHub.
        And if Tern speaks to you, I’d love to hear from you.
      </Text>
      <Text style={s.para}>
        I hope it brings you some of the joy it’s brought me.
      </Text>
      <Text style={s.signOff}>– Aiden</Text>

      <View style={s.links}>
        <LetterLink
          icon='github'
          label='Source code on GitHub'
          onPress={() => open(AboutLinks.SOURCE_CODE, 'GitHub')}
        />
        <LetterLink
          icon='email-outline'
          label='Email Aiden'
          onPress={() => open(AboutLinks.EMAIL, 'your mail app')}
        />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  para: { ...typography.meta, lineHeight: 19, marginTop: space.sm },
  signOff: {
    ...typography.heading,
    fontFamily: font.display,
    marginTop: space.md,
  },
  links: { marginTop: space.md },
});
