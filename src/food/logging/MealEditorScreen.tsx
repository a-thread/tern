import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space, tierColors } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { TierDot } from '../components';
import { useFoodDisplay } from '../useFoodDisplay';
import { useSavedMeals } from '../SavedMealsContext';
import { isDraftDirty, scaledTotals } from '../mealDraft';
import { MAX_MEAL_ITEMS, MAX_MEAL_NAME } from '../savedMeals';
import type { LogFoodStackParamList } from '../types';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'MealEditor'>;

/**
 * Builds a new saved meal, or edits an existing one: name it, change portions,
 * remove foods, and add more (through the normal food search in "pick" mode).
 * Nothing is saved until Save; Cancel throws the changes away.
 */
export default function MealEditorScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();
  const {
    draft,
    setDraftName,
    stepDraftItem,
    removeDraftItem,
    discardDraft,
    commitDraft,
  } = useSavedMeals();
  const [error, setError] = React.useState<string | null>(null);

  if (!draft) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
        <SheetNav title='Meal' leftLabel='Back' onLeftPress={() => navigation.goBack()} />
        <Text style={s.gone}>There is no meal open.</Text>
      </View>
    );
  }

  const isNew = draft.id === null;
  const totals = scaledTotals(draft.items, 1);
  const atLimit = draft.items.length >= MAX_MEAL_ITEMS;

  const cancel = () => {
    const close = () => {
      discardDraft();
      navigation.goBack();
    };
    if (!isDraftDirty(draft)) return close();
    Alert.alert('Discard changes?', isNew ? 'This meal has not been saved.' : 'Your changes to this meal will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: close },
    ]);
  };

  const save = () => {
    const result = commitDraft();
    if (!result.ok) return setError(result.error);
    toast.show(result.created ? `Saved “${result.meal.name}”` : `Updated “${result.meal.name}”`);
    navigation.goBack();
  };

  const addFood = () => {
    // Uses the same search as logging, but chosen foods go into this meal.
    navigation.push('Search', { meal: 'breakfast', pick: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav
        title={isNew ? 'New meal' : 'Edit meal'}
        leftLabel='Cancel'
        onLeftPress={cancel}
        rightLabel='Save'
        onRightPress={save}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps='handled'
      >
        <GroupLabel>Name</GroupLabel>
        <View style={s.card}>
          <TextInput
            value={draft.name}
            onChangeText={(v) => {
              setDraftName(v);
              setError(null);
            }}
            placeholder='e.g. Post-run snack'
            placeholderTextColor={colors.ink3}
            maxLength={MAX_MEAL_NAME}
            autoFocus={isNew}
            returnKeyType='done'
            accessibilityLabel='Meal name'
            style={s.input}
          />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}

        <GroupLabel>
          {`${draft.items.length} ${draft.items.length === 1 ? 'food' : 'foods'}${showCalories ? ` · ${Math.round(totals.calories)} cal` : ''}`}
        </GroupLabel>
        <Group>
          {draft.items.map((item, i) => (
            <View key={`${item.name}-${i}`} style={s.row}>
              {showTiers ? (
                <TierDot
                  tier={item.tier}
                  color={tierColors[item.tier]}
                  showNumber={showTierNumber}
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.sub}>
                  {item.servingLabel}
                  {showCalories ? ` · ${Math.round(item.calories * item.servings)} cal` : ''}
                </Text>
              </View>
              <View style={s.stepper}>
                <Pressable onPress={() => stepDraftItem(i, -0.5)} hitSlop={8} accessibilityLabel={`Less ${item.name}`}>
                  <Text style={s.stepperBtn}>−</Text>
                </Pressable>
                <Text style={s.stepperVal}>{item.servings}×</Text>
                <Pressable onPress={() => stepDraftItem(i, 0.5)} hitSlop={8} accessibilityLabel={`More ${item.name}`}>
                  <Text style={s.stepperBtn}>+</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => removeDraftItem(i)} hitSlop={10} accessibilityLabel={`Remove ${item.name}`}>
                <Text style={s.remove}>✕</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            style={s.row}
            android_ripple={{ color: colors.coralTint }}
            onPress={addFood}
            disabled={atLimit}
          >
            <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
              <Path d='M12 5v14M5 12h14' stroke={colors.coral} strokeWidth={3} strokeLinecap='round' />
            </Svg>
            <Text style={[s.name, { color: colors.coral }]}>
              {atLimit ? `Up to ${MAX_MEAL_ITEMS} foods` : 'Add food'}
            </Text>
          </Pressable>
        </Group>

        <Pressable style={s.bigBtn} onPress={save}>
          <Text style={s.bigBtnText}>Save meal</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 13,
    paddingVertical: 4,
  },
  input: {
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 11,
  },
  error: { fontFamily: font.body, fontSize: 12.5, color: '#B3261E', marginTop: 6, marginLeft: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  name: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11, color: colors.ink2, marginTop: 1 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepperBtn: {
    fontFamily: font.body,
    fontSize: 16,
    color: colors.coral,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stepperVal: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.ink,
    minWidth: 32,
    textAlign: 'center',
  },
  remove: { fontSize: 13, color: colors.ink3, paddingHorizontal: 2 },
  bigBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: space.lg,
  },
  bigBtnText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
  gone: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    textAlign: 'center',
    padding: space.xl,
  },
});
