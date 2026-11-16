import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, space, typography } from '@shared/theme';
import { Card } from '@shared/components/ui';
import { FadeIn } from '@shared/components/FadeIn/FadeIn';
import { LetterRest } from './components/LetterRest/LetterRest';

/**
 * Why Tern exists, in Aiden's words. Folded to its first paragraph so Support Tern stays in
 * reach; opening it shows the rest, the source code and a way to write back. It doesn't fold again.
 */
export function Letter() {
  const [whole, setWhole] = useState(false);

  return (
    <Card>
      <Text style={s.first}>
        I made Tern for myself. I’d been using an app that was framed as a tool
        to help me lose weight and be healthy but in the end, and I ended up
        falling back into old disordered eating habits. So, in my off hours, I
        started building something different: an app that felt good, that I
        wanted to come back to, and that didn’t try to sell me anything or sell
        anything of mine.
      </Text>
      {whole ? (
        // Fades in, or appears at once with Reduce Motion on.
        <FadeIn>
          <LetterRest />
        </FadeIn>
      ) : (
        <Pressable
          style={s.more}
          onPress={() => setWhole(true)}
          hitSlop={8}
          accessibilityRole='button'
        >
          <Text style={s.moreText}>Read the whole letter</Text>
        </Pressable>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  first: { ...typography.meta, lineHeight: 19 },
  more: { alignSelf: 'flex-start', marginTop: space.sm },
  moreText: {
    ...typography.meta,
    fontFamily: font.semibold,
    color: colors.water,
  },
});
