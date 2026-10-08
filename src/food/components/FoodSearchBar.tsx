import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space } from '@shared/theme';

/**
 * The search field, with a button that opens the barcode scanner. While a
 * database search runs (`busy`), a thin line moves along the field's bottom
 * edge; it sits inside the field, so nothing below it moves.
 */
export function FoodSearchBar({
  value,
  onChange,
  onScan,
  busy = false,
}: {
  value: string;
  onChange: (query: string) => void;
  onScan: () => void;
  busy?: boolean;
}) {
  return (
    <View style={s.bar}>
      <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke={colors.ink3} strokeWidth={2.5}>
        <Path d='M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4' />
      </Svg>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder='Search foods'
        placeholderTextColor={colors.ink3}
        style={s.input}
        autoFocus
      />
      <Pressable style={s.scan} onPress={onScan} accessibilityLabel='Scan a barcode'>
        <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth={2}>
          <Path d='M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M6 12h12' />
        </Svg>
      </Pressable>
      {busy ? <ProgressLine /> : null}
    </View>
  );
}

/** An indeterminate line: a short segment sliding along the bottom edge. */
function ProgressLine() {
  const [width, setWidth] = useState(0);
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  const segment = width * 0.3;
  return (
    <View
      style={s.track}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel='Searching foods'
    >
      <Animated.View
        style={[
          s.segment,
          {
            width: segment,
            transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-segment, width] }) }],
          },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.track,
    borderRadius: radius.md - 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: space.lg,
    overflow: 'hidden',
  },
  input: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.ink, padding: 0 },
  scan: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2 },
  segment: { height: 2, borderRadius: 1, backgroundColor: colors.coral },
});
