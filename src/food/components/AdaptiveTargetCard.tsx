import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';
import { BottomSheet, FootNote, Group, GroupLabel, ProgressBar, SegmentedControl, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { useAdaptiveTarget } from '@food/hooks/useAdaptiveTarget';
import { AdaptiveTarget, Aim, AIM_LABEL } from '@food/models/energyBalance';

const AIMS = Object.values(Aim);

/**
 * The Calories tab's adaptive target: on or off, which way you're aiming, and
 * what Tern has learned about your burn, with the suggestion when there is one.
 */
export function AdaptiveTargetCard() {
  const { settings, updateSettings } = useSettings();
  const adaptive = useAdaptiveTarget();
  const [info, setInfo] = useState(false);
  const e = adaptive.estimate;

  return (
    <>
      <GroupLabel>Adaptive target</GroupLabel>
      <Group>
        <ToggleRow
          title='Adapt my target'
          sub={
            adaptive.available
              ? 'Learns what you burn from your log and weight trend'
              : 'Needs calories and weight both tracked'
          }
          on={adaptive.available && settings.adaptTarget}
          onToggle={(v) => adaptive.available && updateSettings({ adaptTarget: v })}
        />
      </Group>

      {adaptive.on ? (
        <>
          <Text style={s.label}>Aiming to</Text>
          <SegmentedControl options={AIMS} value={settings.aim} onChange={(aim) => updateSettings({ aim })} label={(a) => AIM_LABEL[a]} />

          <View style={s.card}>
            {e === null ? (
              <Text style={s.sub}>Working it out…</Text>
            ) : e.status === 'learning' ? (
              <>
                <Text style={s.title}>Learning your burn</Text>
                <Text style={s.sub}>
                  {`${e.loggedDays} of ${e.neededDays} days logged · ${e.weighIns} of ${e.neededWeighIns} weigh-ins, over the last ${AdaptiveTarget.WINDOW_DAYS} days`}
                </Text>
                <View style={{ marginTop: space.sm }}>
                  <ProgressBar
                    value={Math.min(e.loggedDays / e.neededDays, e.weighIns / e.neededWeighIns, 1)}
                    color={colors.aurora}
                  />
                </View>
                <Text style={[s.sub, { marginTop: space.sm }]}>
                  Until then, your target stays as you set it.
                </Text>
              </>
            ) : (
              <>
                <Text style={s.title}>{`You burn about ${e.kcal.toLocaleString()} a day`}</Text>
                <Text style={s.sub}>
                  {`Last ${AdaptiveTarget.WINDOW_DAYS} days: logged ${e.meanIntake.toLocaleString()} a day on average, trend weight ${
                    e.trendChangeLb === 0 ? 'steady' : `${e.trendChangeLb < 0 ? 'down' : 'up'} ${Math.abs(e.trendChangeLb)} lb`
                  }. Likely between ${e.low.toLocaleString()} and ${e.high.toLocaleString()}.`}
                </Text>
                {adaptive.offer && adaptive.suggestion !== null ? (
                  <View style={s.suggest}>
                    <Text style={s.title}>{`Suggested target: ${adaptive.suggestion.toLocaleString()}`}</Text>
                    <View style={s.actions}>
                      <Pressable style={s.use} onPress={adaptive.apply} accessibilityRole='button'>
                        <Text style={s.useText}>{`Use ${adaptive.suggestion.toLocaleString()}`}</Text>
                      </Pressable>
                      <Pressable onPress={adaptive.dismiss} hitSlop={8} accessibilityRole='button'>
                        <Text style={s.notNow}>Not now</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text style={[s.sub, { marginTop: space.sm }]}>Your target fits your aim for now.</Text>
                )}
              </>
            )}
            <Pressable onPress={() => setInfo(true)} hitSlop={8} accessibilityRole='button'>
              <Text style={s.how}>How this works</Text>
            </Pressable>
          </View>
          <FootNote>
            Suggestions change your target by at most 100 a week and never apply on their own. Exercise
            is already in here, so workouts never add calories by themselves.
          </FootNote>
        </>
      ) : null}

      <BottomSheet visible={info} onClose={() => setInfo(false)}>
        <View style={s.sheetTop}>
          <Text style={s.sheetTitle}>How the adaptive target works</Text>
          <Pressable onPress={() => setInfo(false)} hitSlop={10} accessibilityLabel='Close'>
            <Text style={s.close}>×</Text>
          </Pressable>
        </View>
        <Text style={s.point}>
          {`Over the last ${AdaptiveTarget.WINDOW_DAYS} days, Tern compares what you logged with how your trend weight moved. Eating 2,050 a day while your trend drops 1.2 lb in three weeks means you burn about 2,250.`}
        </Text>
        <Text style={s.point}>
          That counts everything you do: workouts, walking, work. It also absorbs small habits in how you
          log, so it can be more accurate than any calorie estimate for a single workout.
        </Text>
        <Text style={s.point}>
          It needs most days fully logged (days with nothing logged are left out, never counted as eating
          nothing) and a few weigh-ins each week. A suggestion never aims below 1,200, or for losing more
          than 1% of your weight a week.
        </Text>
      </BottomSheet>
    </>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: font.body, fontSize: 12, color: colors.ink2, marginTop: space.md, marginBottom: 6, marginLeft: space.xs },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md + 1, marginTop: space.md },
  title: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 12, lineHeight: 17, color: colors.ink2, marginTop: 4 },
  suggest: { marginTop: space.md, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
  use: { backgroundColor: colors.coral, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  useText: { fontFamily: font.bold, fontSize: 13, color: '#fff' },
  notNow: { fontFamily: font.medium, fontSize: 13, color: colors.ink2 },
  how: { fontFamily: font.semibold, fontSize: 12.5, color: colors.coral, marginTop: space.md },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  sheetTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
  point: { fontFamily: font.body, fontSize: 12.5, lineHeight: 18, color: colors.ink2, marginTop: space.sm },
});
