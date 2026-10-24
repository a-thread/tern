import React, { useState } from 'react';
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

import {
  colors,
  font,
  radius,
  space,
  tierColors,
  typography,
} from '@shared/theme';
import { GroupLabel, ProgressBar } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import {
  macroFill,
  MINIMUM_MARK,
  minimumFill,
  resolveZone,
  zoneScale,
  zoneStatus,
} from '@/domain/food/models/intakeZone';
import { percentsFromMacros } from '@/domain/food/models/macroSplit';
import { dayTotals } from '@/domain/food/models/foodEntry';
import { useFood } from '@/domain/food/FoodContext';
import { tierShares } from './models/tierShares';
import { NovaInfoSheet } from './components/NovaInfoSheet/NovaInfoSheet';
import {
  IntakeInfoKind,
  IntakeInfoSheet,
} from './components/IntakeInfoSheet/IntakeInfoSheet';
import { useRootNavigation } from '@/navigation/useAppNavigation';
import { IntakePage } from './models/intakePage';
import { useViewedDay } from '@/shared/state/ViewedDayContext';
import { dayWord } from '@/shared/utils/date';

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
 * The viewed day's intake at a glance, heading the Food screen and sitting on Today: calories
 * against a soft target zone, macros against their targets, and the processing-level split.
 * Off by default; turned on and off in Food display settings, and absent while neither calories
 * nor macros are tracked. Neutral by design: nothing turns red and going past a target is never flagged.
 */
export function IntakeBars() {
  const { foodLog: entries } = useFood();
  const totals = dayTotals(entries);
  const { settings } = useSettings();
  const { showCalories, showMacros, showTiers, tracksIntake } =
    useFoodDisplay();
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [info, setInfo] = useState<IntakeInfoKind | null>(null);
  const [novaOpen, setNovaOpen] = useState(false);
  const navigation = useRootNavigation();
  const { day, today } = useViewedDay();

  // Each page's own height, so the card is only as tall as the page showing.
  const [heights, setHeights] = useState<Record<string, number>>({});

  if (!settings.showIntakeBars || !tracksIntake) return null;

  // Macros first (while tracked); the processing split only when processing levels are shown;
  // calories last.
  const pages: IntakePage[] = [
    ...(showMacros ? [IntakePage.Macros] : []),
    ...(showTiers ? [IntakePage.Processing] : []),
    ...(showCalories ? [IntakePage.Calories] : []),
  ];
  if (!pages.length) return null;
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
    <>
      <GroupLabel>{dayWord(day, today) + "'s Nutrition"}</GroupLabel>
      <View style={s.card}>
        {/* Measured on the scroller itself (inside the card padding), so each page is exactly one viewport wide. */}
        <ScrollView
          horizontal
          pagingEnabled
          onLayout={onLayout}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          scrollEnabled={pages.length > 1}
          style={
            heights[pages[page]] ? { height: heights[pages[page]] } : undefined
          }
        >
          {pages.map((p) => (
            <View
              key={p}
              style={{ width: width || undefined, alignSelf: 'flex-start' }}
              onLayout={(e) => {
                const h = Math.ceil(e.nativeEvent.layout.height);
                setHeights((prev) =>
                  prev[p] === h ? prev : { ...prev, [p]: h },
                );
              }}
            >
              {p === IntakePage.Calories ? (
                <View>
                  <View style={s.titleRow}>
                    <Text style={s.title}>Calories</Text>
                    <InfoDot
                      label='About your target zone'
                      onPress={() => setInfo(IntakeInfoKind.Calories)}
                    />
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
                      style={[
                        s.zoneLabel,
                        { left: `${scale.zoneStart * 100}%` },
                      ]}
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
              ) : p === IntakePage.Processing ? (
                <View>
                  <View style={s.titleRow}>
                    <Text style={s.title}>Processing levels</Text>
                    <InfoDot
                      label='About NOVA processing levels'
                      onPress={() => setNovaOpen(true)}
                    />
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
                    <InfoDot
                      label='About your macro targets'
                      onPress={() => setInfo(IntakeInfoKind.Macros)}
                    />
                  </View>
                  {MACROS.map(({ key, label, color }) => {
                    const target = settings.macroTargets[key];
                    const minimum =
                      key === 'protein' && settings.proteinAsMinimum;
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
                            value={
                              minimum
                                ? minimumFill(totals[key], target)
                                : macroFill(totals[key], target)
                            }
                            color={color}
                            height={5}
                          />
                          {minimum ? (
                            <View
                              style={[
                                s.mark,
                                { left: `${MINIMUM_MARK * 100}%` },
                              ]}
                            />
                          ) : null}
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

        <NovaInfoSheet visible={novaOpen} onClose={() => setNovaOpen(false)} />
        <IntakeInfoSheet
          kind={info ?? IntakeInfoKind.Calories}
          visible={info !== null}
          onClose={() => setInfo(null)}
          onAction={() => {
            setInfo(null);
            navigation.navigate('Settings', { screen: 'Targets' });
          }}
        />
      </View>
    </>
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
  status: { ...typography.caption, marginTop: 6 },
  pct: { fontFamily: font.body, fontSize: 11.5, color: colors.ink3 },
  mark: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 11,
    borderRadius: 1,
    backgroundColor: colors.ink2,
  },
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
  infoText: {
    fontFamily: font.semibold,
    fontSize: typography.small.fontSize,
    color: colors.ink3,
    lineHeight: 13,
  },
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
    ...typography.small,
    color: colors.aurora,
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  now: { fontFamily: font.semibold, fontSize: 12, color: colors.ink },
  end: { fontFamily: font.body, fontSize: 11.5, color: colors.ink3 },
  macroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroLabel: { fontFamily: font.body, fontSize: 12.5, color: colors.ink },
  macroSub: typography.caption,
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: space.md,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.track },
  dotOn: { backgroundColor: colors.ink },
});
