import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space } from '@shared/theme';
import WaterCard from '@water/components/WaterCard';

/** Today's water as a sheet that slides up from the bottom: the same quick-add, custom amount and undo as the Food card. */
export default function WaterSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
    >
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel='Close water' />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={s.top}>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel='Close'>
              <Text style={s.close}>×</Text>
            </Pressable>
          </View>
          <WaterCard bare />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(43,38,34,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.lg,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: space.sm,
  },
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
});
