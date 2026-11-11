import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChartTip } from '../ChartTip/ChartTip';

/**
 * Invisible tap targets laid over an SVG line chart whose points are spread evenly from its
 * left edge to its right (one point sits in the middle). Each zone reaches halfway to its
 * neighbours, so a tap picks the nearest point, and the picked point's label shows over the
 * chart. `labels` say what each point is, date first ("Aug 2 · 172.4 lb"); screen readers
 * read them too.
 *
 * `viewBoxWidth` is the chart's viewBox width: an SVG drawn 100% wide keeps its aspect ratio,
 * so on a wide card it is drawn no wider than that, centred, and the zones match it.
 */
export function PointTapZones({
  labels,
  selected,
  onSelect,
  viewBoxWidth,
}: {
  labels: readonly string[];
  selected: number | null;
  onSelect: (index: number) => void;
  viewBoxWidth: number;
}) {
  const n = labels.length;
  return (
    <View style={s.overlay}>
      <View style={[s.chart, { maxWidth: viewBoxWidth }]}>
        <View style={s.zones}>
          {labels.map((label, i) => (
            <Pressable
              key={i}
              // The end points sit on the chart's edges, so their zones are half as wide.
              style={{ flex: n > 1 && (i === 0 || i === n - 1) ? 0.5 : 1 }}
              onPress={() => onSelect(i)}
              accessibilityRole='button'
              accessibilityLabel={label}
              accessibilityState={{ selected: selected === i }}
            />
          ))}
        </View>
        {selected !== null && selected < n ? (
          <ChartTip
            text={labels[selected]}
            at={n > 1 ? selected / (n - 1) : 0.5}
          />
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center' },
  chart: { width: '100%', height: '100%' },
  zones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
});
