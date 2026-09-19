import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space, tierColors } from '@shared/theme';
import {
  Group,
  GroupLabel,
  SheetNav,
  Chevron,
  FootNote,
} from '@shared/components/ui';
import { searchResults, recentResults, type SearchResult } from '../searchData';
import { TierDot } from '../components';
import type { LogFoodStackParamList } from '../types';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'Search'>;

const FILTERS = ['All', 'My foods', 'Recent'] as const;

export default function LogFoodScreen({ navigation, route }: Props) {
  const { meal } = route.params;
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('oat');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const results = useMemo(
    () =>
      query.trim()
        ? searchResults.filter((r) =>
            r.name.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : searchResults,
    [query],
  );
  const showResults = filter !== 'Recent';
  const showRecent = filter !== 'My foods';

  const pick = (result: SearchResult) => {
    if (result.tier === null) {
      navigation.navigate('ManualFoodEntry', { meal, name: result.name });
    } else {
      navigation.navigate('FoodDetail', { meal, result });
    }
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title={`Add to ${meal}`}
        leftLabel='Cancel'
        onLeftPress={() => navigation.getParent()?.goBack()}
      />

      <View style={s.searchBar}>
        <Svg
          width={15}
          height={15}
          viewBox='0 0 24 24'
          fill='none'
          stroke={colors.ink3}
          strokeWidth={2.5}
        >
          <Path d='M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4' />
        </Svg>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder='Search foods'
          placeholderTextColor={colors.ink3}
          style={s.searchInput}
          autoFocus
        />
        <Pressable
          style={s.scanBtn}
          onPress={() => navigation.navigate('BarcodeScan', { meal })}
        >
          <Svg
            width={15}
            height={15}
            viewBox='0 0 24 24'
            fill='none'
            stroke='#fff'
            strokeWidth={2}
          >
            <Path d='M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M6 12h12' />
          </Svg>
        </Pressable>
      </View>

      <View style={s.seg}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[s.segItem, filter === f && s.segOn]}
          >
            <Text style={[s.segText, filter === f && s.segTextOn]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps='handled'
      >
        {showResults ? (
          <>
            <GroupLabel>Results</GroupLabel>
            <Group>
              {results.map((r) => (
                <ResultRow key={r.id} result={r} onPress={() => pick(r)} />
              ))}
            </Group>
          </>
        ) : null}

        {showRecent ? (
          <>
            <GroupLabel>Logged recently</GroupLabel>
            <Group>
              {recentResults.map((r) => (
                <ResultRow key={r.id} result={r} onPress={() => pick(r)} />
              ))}
            </Group>
          </>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('ManualFoodEntry', { meal })}
          style={s.ghostBtn}
        >
          <Text style={s.ghostText}>+ Create a food manually</Text>
        </Pressable>

        <FootNote>
          Nutrition data from Open Food Facts, used under ODbL.
        </FootNote>
      </ScrollView>
    </View>
  );
}

function ResultRow({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress: () => void;
}) {
  const unknown = result.tier === null;
  return (
    <Pressable
      style={s.row}
      android_ripple={{ color: colors.doveTint }}
      onPress={onPress}
    >
      {unknown ? (
        <View style={[s.tierUnknown]}>
          <Text style={s.tierUnknownText}>?</Text>
        </View>
      ) : (
        <TierDot
          tier={result.tier as number}
          color={tierColors[result.tier as 1 | 2 | 3 | 4]}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{result.name}</Text>
        <Text style={s.rowSub}>
          {unknown
            ? 'No nutrition data · tap to fill in'
            : `${result.brand ? result.brand + ' · ' : ''}${result.calories} cal / ${result.servingLabel}`}
        </Text>
      </View>
      {unknown ? (
        <Chevron />
      ) : (
        <View style={s.plusBtn}>
          <Svg
            width={12}
            height={12}
            viewBox='0 0 24 24'
            fill='none'
            stroke={colors.coral}
            strokeWidth={3}
          >
            <Path d='M12 5v14M5 12h14' />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8E5DD',
    borderRadius: radius.md - 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: space.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  scanBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: space.lg,
    marginVertical: space.md,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  segOn: { backgroundColor: '#fff' },
  segText: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  segTextOn: { fontFamily: font.semibold, color: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 1,
  },
  plusBtn: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: colors.coralTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierUnknown: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.dove,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierUnknownText: { fontFamily: font.bold, fontSize: 9.5, color: '#4A4A4A' },
  ghostBtn: { alignItems: 'center', paddingVertical: 11, marginTop: 4 },
  ghostText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.coral },
});
