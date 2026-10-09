import React, { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@shared/theme';
import { MovementLimits } from '@movement/models/movementEntry';

/** Drag distance for one minute. */
const PX_PER_MINUTE = 10;
/** Ticks shown either side of the needle. */
const SPAN = 30;

/**
 * A ruler to drag for minutes, like the weigh-in ruler: a tick a minute, a
 * longer one every five, numbers every ten, and the needle in the middle.
 */
export function MinutesRuler({ value, onChange }: { value: number; onChange: (minutes: number) => void }) {
  const current = useRef(value);
  current.current = value;
  const start = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        start.current = current.current;
      },
      onPanResponderMove: (_e, g) => {
        const next = Math.round(start.current - g.dx / PX_PER_MINUTE);
        const clamped = Math.min(Math.max(next, MovementLimits.MIN_MINUTES), MovementLimits.MAX_MINUTES);
        if (clamped !== current.current) onChangeRef.current(clamped);
      },
    }),
  ).current;

  const ticks = useMemo(
    () => Array.from({ length: SPAN * 2 + 1 }, (_, i) => value - SPAN + i),
    [value],
  );

  return (
    <View
      style={s.ruler}
      {...pan.panHandlers}
      accessible
      accessibilityRole='adjustable'
      accessibilityLabel='Duration'
      accessibilityValue={{ text: `${value} minutes` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        onChange(
          Math.min(
            Math.max(value + (e.nativeEvent.actionName === 'increment' ? 5 : -5), MovementLimits.MIN_MINUTES),
            MovementLimits.MAX_MINUTES,
          ),
        )
      }
    >
      <View style={s.track}>
        {ticks.map((m) => (
          <View key={m} style={s.tickCol}>
            {m >= 0 ? (
              <>
                <View style={[s.tick, m % 5 === 0 && s.tickMid, m % 10 === 0 && s.tickMajor]} />
                {m % 10 === 0 ? <Text style={s.label}>{m}</Text> : null}
              </>
            ) : null}
          </View>
        ))}
      </View>
      <View style={s.needle} pointerEvents='none' />
    </View>
  );
}

const s = StyleSheet.create({
  ruler: { height: 84, backgroundColor: colors.track, overflow: 'hidden', justifyContent: 'flex-start' },
  track: { flexDirection: 'row', alignSelf: 'center', height: 84, width: PX_PER_MINUTE * (SPAN * 2 + 1) },
  tickCol: { width: PX_PER_MINUTE, alignItems: 'center' },
  tick: { width: 1.5, height: 14, backgroundColor: colors.ink3 },
  tickMid: { height: 22 },
  tickMajor: { height: 32, width: 2, backgroundColor: colors.ink },
  label: { position: 'absolute', top: 40, width: 40, textAlign: 'center', fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  needle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 3,
    height: 36,
    marginLeft: -1.5,
    backgroundColor: colors.coral,
    borderRadius: 2,
  },
});
