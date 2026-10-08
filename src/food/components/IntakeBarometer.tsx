import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors, font, radius, space } from '@shared/theme';
import { ProgressBar } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import { macroFill, resolveZone, zoneScale } from '@food/models/intakeZone';

type Totals = { calories: number; protein: number; carbs: number; fat: number };

const MACROS = [
  { key: 'protein', label: 'Protein', color: colors.kelp },
  { key: 'carbs', label: 'Carbs', color: colors.glacierDeep },
  { key: 'fat', label: 'Fat', color: colors.sunDeep },
] as const;

/**
 * Optional calories-and-macros bars for the Food page: calories against a soft
 * target zone, macros against their targets. Off by default; turned on and off in Food display settings.
 * Neutral by design: nothing turns red and going past a target is never flagged.
 */
export function IntakeBarometer({ totals }: { totals: Totals }) {
  const { settings } = useSettings();
  const { showCalories } = useFoodDisplay();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  // Each page's own height, so the card is only as tall as the page showing.
  const [heights, setHeights] = useState<Record<string, number>>({});

  if (!settings.showIntakeBars || !settings.trackCalories) return null;

  const pages = showCalories ? (['macros', 'calories'] as const) : (['macros'] as const);
  const zone = resolveZone(settings.calorieZone, settings.calorieTarget);
  const scale = zoneScale(totals.calories, zone);

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width);
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={s.card}>
      {/* Measured on the scroller itself (inside the card padding), so each page is exactly one viewport wide. */}
      <ScrollView
        horizontal
        pagingEnabled
        onLayout={onLayout}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEnabled={pages.length > 1}
        style={heights[pages[page]] ? { height: heights[pages[page]] } : undefined}
      >
        {pages.map((p) => (
          <View
            key={p}
            style={{ width: width || undefined, alignSelf: 'flex-start' }}
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              setHeights((prev) => (prev[p] === h ? prev : { ...prev, [p]: h }));
            }}
          >
            {p === 'calories' ? (
              <View>
                <Text style={s.title}>Calories</Text>
                <View style={s.track}>
                  <View
                    style={[
                      s.zone,
                      {
                        left: `${scale.zoneStart * 100}%`,
                        width: `${(scale.zoneEnd - scale.zoneStart) * 100}%`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      s.fill,
                      { width: `${Math.max(scale.fill, 0.02) * 100}%` },
                    ]}
                  />
                  <Text
                    style={[s.zoneLabel, { left: `${scale.zoneStart * 100}%` }]}
                  >
                    Target zone
                  </Text>
                </View>
                <View style={s.ends}>
                  <Text style={s.now}>
                    {Math.round(totals.calories).toLocaleString()} cal
                  </Text>
                  <Text style={s.end}>
                    {zone.min.toLocaleString()} – {zone.max.toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                <Text style={s.title}>Macros</Text>
                {MACROS.map(({ key, label, color }) => {
                  const target = settings.macroTargets[key];
                  const minimum = key === 'protein' && settings.proteinAsMinimum;
                  return (
                    <View key={key} style={{ marginTop: space.sm }}>
                      <View style={s.macroTop}>
                        <Text style={s.macroLabel}>
                          {label}
                          {minimum ? ' (min)' : ''}
                        </Text>
                        <Text style={s.macroSub}>
                          {Math.round(totals[key])} / {target} g
                        </Text>
                      </View>
                      <ProgressBar
                        value={macroFill(totals[key], target)}
                        color={color}
                        height={5}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {pages.length > 1 ? (
        <View style={s.dots}>
          {pages.map((p, i) => (
            <View key={p} style={[s.dot, i === page && s.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
    marginTop: space.xs,
  },
  title: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.doveTint,
    marginTop: 26,
    marginBottom: 8,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.aurora,
  },
  zone: {
    position: 'absolute',
    top: -3,
    height: 14,
    borderRadius: 5,
    backgroundColor: colors.auroraTint,
  },
  zoneLabel: {
    position: 'absolute',
    top: -20,
    fontFamily: font.body,
    fontSize: 10.5,
    color: colors.aurora,
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  now: { fontFamily: font.semibold, fontSize: 12, color: colors.ink },
  end: { fontFamily: font.body, fontSize: 11.5, color: colors.ink3 },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  macroLabel: { fontFamily: font.body, fontSize: 12.5, color: colors.ink },
  macroSub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: space.md },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.track },
  dotOn: { backgroundColor: colors.ink },
});
