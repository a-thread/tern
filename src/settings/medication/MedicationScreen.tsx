import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, space, typography } from '@shared/theme';
import { Frequency } from '@shared/models/frequency';
import {
  Group,
  GroupLabel,
  FootNote,
  PushHeader,
  ToggleRow,
} from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { newId } from '@shared/utils/id';
import { useMedication } from '../../domain/medication/MedicationContext';
import {
  cleanMedName,
  newMedication,
  validateMedName,
  type Medication,
  MedicationLimits,
} from '../../domain/medication/models/medication';
import { useSettings } from '../../domain/settings/SettingsContext';
import TimeStepperRow from '../components/TimeStepperRow';
import {
  formatMinutes,
  stepMinutes,
  stepWeekday,
  weekdayPlural,
  Reminders,
} from '../../domain/settings/models/reminderPlan';
import { confirm } from '@shared/utils/confirm';

export default function MedicationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { removeMedication } = useMedication();
  const toast = useToast();
  const meds = settings.medications;
  const [newName, setNewName] = useState('');

  const change = (id: string, patch: Partial<Medication>) =>
    updateSettings({
      medications: meds.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });

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
    confirm({
      title: `Stop tracking ${m.name}?`,
      message: 'Its history is removed too. This can’t be undone.',
      action: 'Remove',
      onConfirm: () => removeMedication(m.id),
    });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Medication'
        backLabel='Settings'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <FootNote>
          Optional. Tern only keeps whether you took each one, nothing about
          doses or why. Tap a medication on Today to mark it taken.
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

        {meds.length < MedicationLimits.MAX_COUNT ? (
          <>
            <GroupLabel>
              {meds.length ? 'Add another' : 'Add a medication'}
            </GroupLabel>
            <View style={s.addRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={add}
                placeholder='Name, e.g. Vitamin D'
                placeholderTextColor={colors.ink3}
                maxLength={MedicationLimits.MAX_NAME_LENGTH}
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
          <FootNote>{`You’re tracking the most Tern can hold (${MedicationLimits.MAX_COUNT}).`}</FootNote>
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
            maxLength={MedicationLimits.MAX_NAME_LENGTH}
            returnKeyType='done'
            accessibilityLabel={`Name of ${med.name}`}
            style={s.nameInput}
          />
        </View>
        <View style={s.freqRow}>
          <Text style={s.freqLabel}>Take it</Text>
          <View style={s.freqSeg}>
            {[Frequency.Daily, Frequency.Weekly].map((f) => (
              <Pressable
                key={f}
                onPress={() => onChange({ frequency: f })}
                style={[s.freqItem, med.frequency === f && s.freqItemOn]}
                accessibilityRole='button'
                accessibilityState={{ selected: med.frequency === f }}
              >
                <Text style={[s.freqText, med.frequency === f && s.freqTextOn]}>
                  {f === Frequency.Daily ? 'Daily' : 'Weekly'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {med.frequency === Frequency.Weekly ? (
          <TimeStepperRow
            label='Day'
            value={weekdayPlural(med.weekday)}
            onStep={(d) => onChange({ weekday: stepWeekday(med.weekday, d) })}
          />
        ) : null}
        <TimeStepperRow
          label='Due'
          value={formatMinutes(med.at)}
          onStep={(d) =>
            onChange({ at: stepMinutes(med.at, d * Reminders.STEP_MINUTES) })
          }
        />
        <ToggleRow
          title='Remind me'
          sub={
            med.remind
              ? med.frequency === Frequency.Weekly
                ? `${weekdayPlural(med.weekday)} at ${formatMinutes(med.at)}`
                : `Every day at ${formatMinutes(med.at)}`
              : 'No reminder'
          }
          on={med.remind}
          onToggle={(v) => onChange({ remind: v })}
        />
        <Pressable
          style={s.removeRow}
          onPress={onRemove}
          accessibilityRole='button'
        >
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
  freqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  freqLabel: typography.rowTitle,
  freqSeg: {
    flexDirection: 'row',
    backgroundColor: colors.track,
    borderRadius: 9,
    padding: 2,
  },
  freqItem: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 7 },
  freqItemOn: { backgroundColor: '#fff' },
  freqText: typography.meta,
  freqTextOn: { fontFamily: font.semibold, color: colors.ink },
  removeRow: { paddingHorizontal: 13, paddingVertical: 12 },
  removeText: {
    fontFamily: font.semibold,
    fontSize: 13.5,
    color: colors.danger,
  },
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
