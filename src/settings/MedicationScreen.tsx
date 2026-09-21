import React, { useEffect, useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
  FootNote,
} from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { newId } from '@shared/utils/id';
import { useMedication } from '@medication/MedicationContext';
import {
  MAX_MEDICATIONS,
  MAX_MED_NAME,
  cleanMedName,
  newMedication,
  validateMedName,
  type Medication,
} from '@medication/medications';
import { useSettings } from './SettingsContext';
import TimeStepperRow from './TimeStepperRow';
import { REMINDER_STEP_MINUTES, formatMinutes, stepMinutes } from './reminders.plan';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Medication'>;

export default function MedicationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { removeMedication } = useMedication();
  const toast = useToast();
  const meds = settings.medications;
  const [newName, setNewName] = useState('');

  const change = (id: string, patch: Partial<Medication>) =>
    updateSettings({ medications: meds.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  const add = () => {
    const problem = validateMedName(newName, meds);
    if (problem) {
      toast.show(problem);
      return;
    }
    updateSettings({ medications: [...meds, newMedication(newName, newId())] });
    setNewName('');
  };

  const confirmRemove = (m: Medication) =>
    Alert.alert(
      `Stop tracking ${m.name}?`,
      'Its history is removed too. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeMedication(m.id) },
      ],
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <PushHeader title='Medication' backLabel='Settings' onBack={() => navigation.goBack()} />

      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 40 }}
      >
        <FootNote>
          Optional. Tern only keeps whether you took each one, nothing about doses or why. Tap
          a medication on Today to mark it taken.
        </FootNote>

        {meds.map((m) => (
          <MedicationCard
            key={m.id}
            med={m}
            others={meds}
            onChange={(patch) => change(m.id, patch)}
            onRemove={() => confirmRemove(m)}
            onInvalid={toast.show}
          />
        ))}

        {meds.length < MAX_MEDICATIONS ? (
          <>
            <GroupLabel>{meds.length ? 'Add another' : 'Add a medication'}</GroupLabel>
            <View style={s.addRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={add}
                placeholder='Name, e.g. Vitamin D'
                placeholderTextColor={colors.ink3}
                maxLength={MAX_MED_NAME}
                autoCapitalize='sentences'
                returnKeyType='done'
                accessibilityLabel='Medication name'
                style={s.input}
              />
              <Pressable
                onPress={add}
                disabled={!cleanMedName(newName)}
                style={[s.addBtn, !cleanMedName(newName) && { opacity: 0.4 }]}
                accessibilityRole='button'
              >
                <Text style={s.addText}>Add</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <FootNote>{`You’re tracking the most Tern can hold (${MAX_MEDICATIONS}).`}</FootNote>
        )}
      </ScrollView>
    </View>
  );
}

function MedicationCard({
  med,
  others,
  onChange,
  onRemove,
  onInvalid,
}: {
  med: Medication;
  others: Medication[];
  onChange: (patch: Partial<Medication>) => void;
  onRemove: () => void;
  onInvalid: (message: string) => void;
}) {
  // Edited locally and saved on blur, so each keystroke isn't a settings write.
  const [name, setName] = useState(med.name);
  useEffect(() => setName(med.name), [med.name]);

  const saveName = () => {
    const problem = validateMedName(name, others, med.id);
    if (problem) {
      onInvalid(problem);
      setName(med.name);
      return;
    }
    const clean = cleanMedName(name);
    setName(clean);
    if (clean !== med.name) onChange({ name: clean });
  };

  return (
    <>
      <GroupLabel>{med.name}</GroupLabel>
      <Group>
        <View style={s.nameRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={saveName}
            onSubmitEditing={saveName}
            maxLength={MAX_MED_NAME}
            returnKeyType='done'
            accessibilityLabel={`Name of ${med.name}`}
            style={s.nameInput}
          />
        </View>
        <TimeStepperRow
          label='Due'
          value={formatMinutes(med.at)}
          onStep={(d) => onChange({ at: stepMinutes(med.at, d * REMINDER_STEP_MINUTES) })}
        />
        <ToggleRow
          title='Remind me'
          sub={med.remind ? `Every day at ${formatMinutes(med.at)}` : 'No reminder'}
          on={med.remind}
          onToggle={(v) => onChange({ remind: v })}
        />
        <Pressable style={s.removeRow} onPress={onRemove} accessibilityRole='button'>
          <Text style={s.removeText}>Stop tracking</Text>
        </Pressable>
      </Group>
    </>
  );
}

const s = StyleSheet.create({
  nameRow: { paddingHorizontal: 13, paddingVertical: 4 },
  nameInput: {
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 8,
  },
  removeRow: { paddingHorizontal: 13, paddingVertical: 12 },
  removeText: { fontFamily: font.semibold, fontSize: 13.5, color: '#B3261E' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addText: { fontFamily: font.bold, fontSize: 14, color: '#fff' },
});
