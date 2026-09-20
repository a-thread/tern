import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, space } from '@shared/theme';
import { FoodApiError } from '../http';
import { getProductByBarcode, isValidBarcode } from '../openFoodFacts';
import type { LogFoodStackParamList } from '../types';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'BarcodeScan'>;

type Phase =
  | { kind: 'scanning' }
  | { kind: 'looking' }
  | { kind: 'miss'; name?: string }
  | { kind: 'error' };

/**
 * Reads a barcode with the camera and looks it up on Open Food Facts. A
 * product with nutrition opens the details screen; anything else falls back
 * to adding the food by hand. A code can also be typed in.
 */
export default function BarcodeScanScreen({ navigation, route }: Props) {
  const { meal } = route.params;
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' });
  const [typing, setTyping] = useState(false);
  const [code, setCode] = useState('');
  // One lookup at a time: the camera fires repeatedly while a code is in view.
  const busy = useRef(false);

  // Coming back from the details screen (or first arriving) starts a fresh scan.
  useFocusEffect(
    useCallback(() => {
      busy.current = false;
      setPhase({ kind: 'scanning' });
    }, []),
  );

  const lookup = async (raw: string) => {
    if (busy.current) return;
    busy.current = true;
    setPhase({ kind: 'looking' });
    try {
      const res = await getProductByBarcode(raw);
      if (res.status === 'found') {
        // Stay on "looking" until this screen regains focus (see above).
        navigation.navigate('FoodDetail', { meal, result: res.result });
        return;
      }
      setPhase({ kind: 'miss', name: res.status === 'no-nutrition' ? res.name : undefined });
    } catch (e) {
      console.warn('Barcode lookup failed', e instanceof FoodApiError ? e.kind : e);
      setPhase({ kind: 'error' });
    }
  };

  const scanAgain = () => {
    busy.current = false;
    setPhase({ kind: 'scanning' });
  };

  const addByHand = (name?: string) =>
    navigation.navigate('ManualFoodEntry', { meal, name });

  const granted = permission?.granted === true;

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
          {granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing='back'
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
              }}
              onBarcodeScanned={
                phase.kind === 'scanning' ? ({ data }) => lookup(data) : undefined
              }
            />
          ) : null}
          <View style={[s.corner, s.tl]} />
          <View style={[s.corner, s.tr]} />
          <View style={[s.corner, s.bl]} />
          <View style={[s.corner, s.br]} />
          {phase.kind === 'looking' ? (
            <View style={s.overlay}>
              <ActivityIndicator color='#F2F6F7' />
            </View>
          ) : null}
        </View>

        {!permission ? (
          <ActivityIndicator color='#C9D4D9' style={{ marginTop: 22 }} />
        ) : !granted ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Camera access needed</Text>
            <Text style={s.cardBody}>
              Tern only uses the camera to read a barcode. Nothing is recorded or
              saved.
            </Text>
            <Pressable
              onPress={() =>
                permission.canAskAgain ? requestPermission() : Linking.openSettings()
              }
              hitSlop={8}
            >
              <Text style={s.action}>
                {permission.canAskAgain ? 'Allow camera' : 'Open settings'}
              </Text>
            </Pressable>
          </View>
        ) : phase.kind === 'miss' ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>
              {phase.name ? `${phase.name} has no nutrition info` : "We couldn't find that product"}
            </Text>
            <Text style={s.cardBody}>
              Not every product is in Open Food Facts. You can add it yourself in a
              few taps.
            </Text>
            <View style={s.cardActions}>
              <Pressable onPress={() => addByHand(phase.name)} hitSlop={8}>
                <Text style={s.action}>Add it yourself</Text>
              </Pressable>
              <Pressable onPress={scanAgain} hitSlop={8}>
                <Text style={s.altAction}>Scan again</Text>
              </Pressable>
            </View>
          </View>
        ) : phase.kind === 'error' ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Couldn't reach Open Food Facts</Text>
            <Text style={s.cardBody}>Check your connection and try again.</Text>
            <Pressable onPress={scanAgain} hitSlop={8}>
              <Text style={s.action}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={s.hint}>Point at the barcode on the package</Text>
        )}

        {typing ? (
          <View style={s.typeRow}>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
              placeholder='Barcode number'
              placeholderTextColor='#7C8B93'
              keyboardType='number-pad'
              maxLength={14}
              autoFocus
              onSubmitEditing={() => isValidBarcode(code) && lookup(code)}
              style={s.input}
              accessibilityLabel='Barcode number'
            />
            <Pressable
              onPress={() => lookup(code)}
              disabled={!isValidBarcode(code) || phase.kind === 'looking'}
              style={[s.go, !isValidBarcode(code) && { opacity: 0.4 }]}
            >
              <Text style={s.goText}>Look up</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setTyping(true)} hitSlop={8}>
            <Text style={s.alt}>Enter code manually</Text>
          </Pressable>
        )}

        <Pressable onPress={() => addByHand()} hitSlop={8}>
          <Text style={s.altPlain}>Or create a food manually</Text>
        </Pressable>

        <Text style={s.foot}>
          Barcodes are looked up on Open Food Facts. Not every product is in the
          database.
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
  viewfinder: {
    width: 290,
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0E1113',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,17,19,0.55)',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: colors.coral,
    borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
  hint: {
    color: '#C9D4D9',
    fontFamily: font.body,
    fontSize: 12.5,
    marginTop: 22,
    textAlign: 'center',
  },
  card: {
    marginTop: 20,
    padding: space.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignSelf: 'stretch',
    gap: 6,
  },
  cardTitle: { color: '#F2F6F7', fontFamily: font.semibold, fontSize: 14 },
  cardBody: { color: '#C9D4D9', fontFamily: font.body, fontSize: 12.5, lineHeight: 18 },
  cardActions: { flexDirection: 'row', gap: 22, marginTop: 4 },
  action: { color: colors.coral, fontFamily: font.semibold, fontSize: 13.5, marginTop: 4 },
  altAction: { color: '#C9D4D9', fontFamily: font.semibold, fontSize: 13.5, marginTop: 4 },
  alt: { color: colors.coral, fontFamily: font.semibold, fontSize: 13, marginTop: 16 },
  altPlain: { color: '#C9D4D9', fontFamily: font.body, fontSize: 12.5, marginTop: 14 },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignSelf: 'stretch' },
  input: {
    flex: 1,
    color: '#F2F6F7',
    fontFamily: font.body,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  go: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.coral,
  },
  goText: { color: '#fff', fontFamily: font.semibold, fontSize: 13.5 },
  foot: {
    color: '#7C8B93',
    fontFamily: font.body,
    fontSize: 10.5,
    marginTop: 26,
    textAlign: 'center',
    lineHeight: 16,
  },
});
