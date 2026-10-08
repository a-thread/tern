import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@shared/theme';

const FADE_IN_MS = 180;
const SLIDE_IN_MS = 280;
const SLIDE_OUT_MS = 200;
const FADE_OUT_MS = 160;

/**
 * A sheet over the current screen. The screen dims first, then the sheet
 * slides up from the bottom; closing runs the same in reverse. (The built-in
 * "slide" modal animation drags the dimming up with the sheet.)
 */
export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Stays mounted through the exit animation, then lets the modal go.
  const [mounted, setMounted] = useState(visible);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 1,
          duration: SLIDE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(slide, {
          toValue: 0,
          duration: SLIDE_OUT_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: FADE_OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, fade, slide]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType='none'
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel='Close' />
      </Animated.View>
      <KeyboardAvoidingView
        style={s.anchor}
        pointerEvents='box-none'
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            s.sheet,
            { paddingBottom: insets.bottom + space.lg },
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(43,38,34,0.35)' },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.lg,
  },
});
