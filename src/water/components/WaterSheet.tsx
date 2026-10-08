import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { BottomSheet } from '@shared/components/ui';
import WaterCard from '@water/components/WaterCard';

/** Today's water as a sheet that slides up from the bottom: the same quick-add, custom amount and undo as the Food card. */
export default function WaterSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.top}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel='Close'>
          <Text style={s.close}>×</Text>
        </Pressable>
      </View>
      <WaterCard bare />
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: space.sm,
  },
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
});
