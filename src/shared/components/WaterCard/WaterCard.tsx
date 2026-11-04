import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

import { colors, font, radius, space } from '../../theme';
import { Card, ProgressBar, Icon } from '../ui';
import { useToast } from '../../state/ToastContext';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { WaterLimits } from '@/domain/water/models/waterEntry';
import { useWater } from '@/domain/water/WaterContext';
import { useViewedDay } from '../../state/ViewedDayContext';
import { waterMessage } from './models/waterMessage';
import WaterGlass from './components/WaterGlass';
import { useDrinkCelebration } from '../../hooks/useDrinkCelebration';
import { WaterSplashLayer } from '../WaterSplashLayer/WaterSplashLayer';

/** Today's water on the Food screen: progress toward the goal, quick-add drink sizes and an undo. */
export default function WaterCard({ bare = false }: { bare?: boolean }) {
  // Its own splash layer, so the splash draws over the card and, in the water sheet, inside the sheet's Modal.
  return (
    <WaterSplashLayer>
      <WaterCardBody bare={bare} />
    </WaterSplashLayer>
  );
}

function WaterCardBody({ bare }: { bare: boolean }) {
  const { totalOz, goalOz, progress, reached, addWater, undoLast, lastOz } =
    useWater();
  // Before yesterday the day's water is only shown, not added to.
  const { editable } = useViewedDay();
  const {
    formatVolume,
    quickWaterOz,
    fromDisplayVolume,
    toDisplayVolume,
    volumeLabel,
  } = useUnits();
  const toast = useToast();
  const [custom, setCustom] = useState<string | null>(null); // the typed amount, while "Other" is open
  const celebrate = useDrinkCelebration();
  // The buttons a drink can come from, so the splash comes out of the one that was tapped.
  const quickRefs = useRef<Record<number, View | null>>({});
  const customRef = useRef<View>(null);

  /** Logs a drink and, when it saves, splashes water around `from` and buzzes so the tap feels finished. */
  const add = (oz: number, from: View | null) => {
    const wasShort = totalOz < goalOz;
    if (!addWater(oz)) return false;
    celebrate(wasShort && totalOz + oz >= goalOz, from);
    return true;
  };

  const addCustom = () => {
    const typed = parseFloat((custom ?? '').replace(',', '.'));
    const oz = Number.isFinite(typed) ? fromDisplayVolume(typed) : NaN;
    if (!add(oz, customRef.current)) {
      toast.show(
        `Enter an amount up to ${toDisplayVolume(WaterLimits.MAX_DRINK_OZ)} ${volumeLabel}.`,
      );
      return;
    }
    setCustom(null);
  };

  // `bare` drops the card chrome, for hosts (like the water sheet) that already provide a surface.
  const Shell = bare ? View : Card;
  return (
    <Shell style={bare ? undefined : { marginTop: space.md }}>
      {bare ? (
        <View>
          <WaterGlass progress={progress} pourKey={totalOz} />
          <Text style={s.big}>{formatVolume(totalOz)}</Text>
          {/* Past the goal the glass stays full and the count keeps going, with no warning. */}
          <Text style={s.bigSub}>
            {totalOz > goalOz
              ? `of ${formatVolume(goalOz)} · ${formatVolume(totalOz - goalOz)} past your goal`
              : `of ${formatVolume(goalOz)} · ${waterMessage(progress, totalOz > 0 ? 1 : 0)}`}
          </Text>
        </View>
      ) : (
        <>
          <View style={s.top}>
            <View style={s.title}>
              <Icon name='water-outline' size={17} color={colors.water} />
              <Text style={s.name}>Water</Text>
            </View>
            <Text style={s.amount}>
              {`${formatVolume(totalOz)} of ${formatVolume(goalOz)}`}
            </Text>
          </View>
          <View style={{ marginTop: space.sm }}>
            <ProgressBar value={progress} color={colors.water} height={7} />
          </View>
          {reached ? (
            <Text style={s.done}>Goal reached. Nicely done.</Text>
          ) : null}
        </>
      )}

      {editable ? (
        <>
          <View style={s.quickRow}>
            {quickWaterOz.map((oz) => (
              <Pressable
                key={oz}
                ref={(el) => {
                  quickRefs.current[oz] = el;
                }}
                onPress={() => add(oz, quickRefs.current[oz] ?? null)}
                style={({ pressed }) => [s.quick, pressed && s.quickPressed]}
                accessibilityRole='button'
                accessibilityLabel={`Add ${formatVolume(oz)} of water`}
              >
                <Text
                  style={s.quickText}
                >{`+${toDisplayVolume(oz)} ${volumeLabel}`}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setCustom(custom === null ? '' : null)}
              style={[s.quick, custom !== null && s.quickOn]}
              accessibilityRole='button'
              accessibilityLabel='Add another amount of water'
            >
              <Text style={s.quickText}>Other</Text>
            </Pressable>
          </View>

          {custom !== null ? (
            <View style={s.customRow}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                onSubmitEditing={addCustom}
                keyboardType='decimal-pad'
                placeholder={`Amount in ${volumeLabel}`}
                placeholderTextColor={colors.ink3}
                maxLength={6}
                autoFocus
                accessibilityLabel={`Amount of water in ${volumeLabel}`}
                style={s.input}
              />
              <Pressable
                ref={customRef}
                onPress={addCustom}
                style={s.addBtn}
                accessibilityRole='button'
              >
                <Text style={s.addText}>Add</Text>
              </Pressable>
            </View>
          ) : null}

          {lastOz !== null ? (
            <Pressable
              onPress={undoLast}
              hitSlop={8}
              accessibilityRole='button'
            >
              <Text
                style={s.undo}
              >{`Undo last (${formatVolume(lastOz)})`}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Shell>
  );
}

const s = StyleSheet.create({
  big: {
    fontFamily: font.displayMedium,
    fontSize: 30,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 2,
  },
  bigSub: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    textAlign: 'center',
    marginTop: 2,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  name: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  amount: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    flexShrink: 1,
    textAlign: 'right',
  },
  done: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.water,
    marginTop: 6,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: space.md,
  },
  quick: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.waterTint,
  },
  quickOn: { backgroundColor: colors.doveTint },
  quickPressed: {
    backgroundColor: colors.waterLight,
    transform: [{ scale: 0.94 }],
  },
  quickText: { fontFamily: font.semibold, fontSize: 12.5, color: colors.water },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addText: { fontFamily: font.bold, fontSize: 13.5, color: colors.onAction },
  undo: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.ink2,
    marginTop: space.md,
    textAlign: 'center',
  },
});
