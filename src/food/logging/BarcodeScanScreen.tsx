import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, space } from '@shared/theme';
import type { LogFoodStackParamList } from '../types';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'BarcodeScan'>;

/**
 * Camera access isn't wired up yet (needs expo-camera + a permission flow) —
 * this renders the real chrome and fallback path so the flow isn't a dead
 * end; "Enter code manually" drops into manual entry same as a scan miss.
 */
export default function BarcodeScanScreen({ navigation, route }: Props) {
  const { meal } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.wrap, { paddingTop: insets.top }]}>
      <View style={s.nav}>
        <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={8}>
          <Text style={s.cancel}>Cancel</Text>
        </Pressable>
        <Text style={s.title}>Scan barcode</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.scanner}>
        <View style={s.viewfinder}>
          <View style={[s.corner, s.tl]} />
          <View style={[s.corner, s.tr]} />
          <View style={[s.corner, s.bl]} />
          <View style={[s.corner, s.br]} />
        </View>
        <Text style={s.hint}>Point at the barcode on the package</Text>
        <Pressable
          onPress={() => navigation.navigate('ManualFoodEntry', { meal })}
        >
          <Text style={s.alt}>Enter code manually</Text>
        </Pressable>
        <Text style={s.foot}>
          Not every product is in the database. If nothing comes up, you can add
          it yourself in a few taps.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#14181B' },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  cancel: { fontFamily: font.body, fontSize: 14, color: '#C9D4D9' },
  title: { fontFamily: font.semibold, fontSize: 15, color: '#F2F6F7' },
  scanner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  viewfinder: { width: 230, height: 150, borderRadius: 14 },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: colors.coral,
    borderWidth: 3,
  },
  tl: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 14,
  },
  tr: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 14,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
  },
  br: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 14,
  },
  hint: {
    color: '#C9D4D9',
    fontFamily: font.body,
    fontSize: 12.5,
    marginTop: 22,
    textAlign: 'center',
  },
  alt: {
    color: colors.coral,
    fontFamily: font.semibold,
    fontSize: 13,
    marginTop: 16,
  },
  foot: {
    color: '#7C8B93',
    fontFamily: font.body,
    fontSize: 10.5,
    marginTop: 26,
    textAlign: 'center',
    lineHeight: 16,
  },
});
