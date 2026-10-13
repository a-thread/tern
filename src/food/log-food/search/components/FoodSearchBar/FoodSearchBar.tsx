import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@shared/components/ui';
import { Animated, Easing, Pressable, StyleSheet, TextInput, View } from 'react-native';

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
      <Icon name='magnify' size={17} color={colors.ink3} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder='Search foods'
        placeholderTextColor={colors.ink3}
        style={s.input}
        autoFocus
      />
      <Pressable style={s.scan} onPress={onScan} accessibilityLabel='Scan a barcode'>
        <Icon name='barcode-scan' size={17} color='#fff' />
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
