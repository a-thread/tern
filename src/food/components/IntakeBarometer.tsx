import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors, font, radius, space, tierColors } from '@shared/theme';
import { ProgressBar } from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { useSettings } from '@settings/SettingsContext';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import {
  macroFill,
  MINIMUM_MARK,
  minimumFill,
  resolveZone,
  zoneScale,
  zoneStatus,
} from '@food/models/intakeZone';
import { percentsFromMacros } from '@food/models/macroSplit';
import type { FoodEntry } from '@food/models/foodEntry';
import { tierShares } from '@food/models/tierShares';
import { NovaInfoSheet } from '@food/components/NovaInfoSheet';
import { IntakeInfoSheet } from '@food/components/IntakeInfoSheet';

type Totals = { calories: number; protein: number; carbs: number; fat: number };

function InfoDot({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={s.info}
      accessibilityRole='button'
      accessibilityLabel={label}
    >
      <Text style={s.infoText}>i</Text>
    </Pressable>
  );
}

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
export function IntakeBarometer({
  totals,
  entries,
}: {
  totals: Totals;
  /** Today's log, for the processing-level split. */
  entries: readonly FoodEntry[];
}) {
  const { settings } = useSettings();
  const { showCalories, showTiers } = useFoodDisplay();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [info, setInfo] = useState<'nova' | 'calories' | 'macros' | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Each page's own height, so the card is only as tall as the page showing.
  const [heights, setHeights] = useState<Record<string, number>>({});

  if (!settings.showIntakeBars || !settings.trackCalories) return null;

  // Macros first; the processing split only when processing levels are shown; calories last.
  const pages: ('macros' | 'processing' | 'calories')[] = [
    'macros',
    ...(showTiers ? (['processing'] as const) : []),
    ...(showCalories ? (['calories'] as const) : []),
  ];
  const shares = tierShares(entries);
  const zone = resolveZone(settings.calorieZone, settings.calorieTarget);
  const scale = zoneScale(totals.calories, zone);
  const status = zoneStatus(totals.calories, zone);
  const splitPct = percentsFromMacros(settings.macroTargets);

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
                <View style={s.titleRow}>
                  <Text style={s.title}>Calories</Text>
                  <InfoDot label='About your target zone' onPress={() => setInfo('calories')} />
                </View>
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
                <Text style={s.status}>
                  {status.kind === 'in'
                    ? 'Within your zone'
                    : status.kind === 'below'
                      ? `${status.amount.toLocaleString()} cal to reach your zone`
                      : `${status.amount.toLocaleString()} cal past your zone`}
                </Text>
              </View>
            ) : p === 'processing' ? (
              <View>
                <View style={s.titleRow}>
                  <Text style={s.title}>Processing levels</Text>
                  <InfoDot label='About NOVA processing levels' onPress={() => setInfo('nova')} />
                </View>
                {shares.map((g) => (
                  <View key={g.key} style={{ marginTop: space.sm }}>
                    <View style={s.macroTop}>
                      <Text style={s.macroLabel}>{g.label}</Text>
                      <Text style={s.macroSub}>
                        {showCalories
                          ? `${Math.round(g.calories).toLocaleString()} cal · ${Math.round(g.share * 100)}%`
                          : `${Math.round(g.share * 100)}%`}
                      </Text>
                    </View>
                    <ProgressBar
                      value={g.share}
                      color={tierColors[g.tiers[0]]}
                      height={5}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <View style={s.titleRow}>
                  <Text style={s.title}>Macros</Text>
                  <InfoDot label='About your macro targets' onPress={() => setInfo('macros')} />
                </View>
                {MACROS.map(({ key, label, color }) => {
                  const target = settings.macroTargets[key];
                  const minimum = key === 'protein' && settings.proteinAsMinimum;
                  return (
                    <View key={key} style={{ marginTop: space.sm }}>
                      <View style={s.macroTop}>
                        <Text style={s.macroLabel}>
                          {label}
                          {minimum ? ' (min)' : ''}
                          <Text style={s.pct}>{`  ${splitPct[key]}%`}</Text>
                        </Text>
                        <Text style={s.macroSub}>
                          {Math.round(totals[key])} / {target} g
                        </Text>
                      </View>
                      <View>
                        <ProgressBar
                          value={minimum ? minimumFill(totals[key], target) : macroFill(totals[key], target)}
                          color={color}
                          height={5}
                        />
                        {minimum ? <View style={[s.mark, { left: `${MINIMUM_MARK * 100}%` }]} /> : null}
                      </View>
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

      <NovaInfoSheet visible={info === 'nova'} onClose={() => setInfo(null)} />
      <IntakeInfoSheet
        kind={info === 'macros' ? 'macros' : 'calories'}
        visible={info === 'calories' || info === 'macros'}
        onClose={() => setInfo(null)}
        onAction={() => {
          setInfo(null);
          navigation.navigate('Settings', { screen: 'Targets' });
        }}
      />
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
  status: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2, marginTop: 6 },
  pct: { fontFamily: font.body, fontSize: 11.5, color: colors.ink3 },
  mark: { position: 'absolute', top: -3, width: 2, height: 11, borderRadius: 1, backgroundColor: colors.ink2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  info: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { fontFamily: font.semibold, fontSize: 10, color: colors.ink3, lineHeight: 12 },
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
