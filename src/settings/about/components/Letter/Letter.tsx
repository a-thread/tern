import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { font, space, typography } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { AboutLinks } from '../../models/aboutLinks';
import { LetterLink } from './components/LetterLink/LetterLink';

/** Why Tern exists, in Aiden's words, with the source code and a way to write back. */
export function Letter() {
  const toast = useToast();

  const open = (url: string, what: string) =>
    Linking.openURL(url).catch((e) => {
      console.warn(`Could not open ${what}`, e);
      toast.show(`Couldn't open ${what}.`);
    });

  return (
    <Card>
      <Text style={s.first}>
        I made Tern for myself. I’d been using an app that promised to help me
        lose weight and be healthy, and I ended up falling back into old
        disordered eating habits. So in my off hours I started building
        something different: an app that felt good, that I wanted to come back
        to, and that didn’t try to sell me anything or sell anything of mine.
      </Text>
      <Text style={s.para}>
        With feedback from my partner, I added safeguards for other traps around
        food and movement, more ways to keep notes, and ternaries, so we could
        send each other recipes and little fish.
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
    </Card>
  );
}

const s = StyleSheet.create({
  first: { ...typography.meta, lineHeight: 19 },
  para: { ...typography.meta, lineHeight: 19, marginTop: space.sm },
  signOff: {
    ...typography.heading,
    fontFamily: font.display,
    marginTop: space.md,
  },
  links: { marginTop: space.md },
});
