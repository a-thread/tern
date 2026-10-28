import React from 'react';

import { Group, GroupLabel, ToggleRow } from '@shared/components/ui';
import { MacroSplitPicker } from '@shared/components/MacroSplitPicker/MacroSplitPicker';
import { useSettings } from '@/domain/settings/SettingsContext';

/** The Macros tab of Targets: pick a preset split or set your own, and how protein is shown. */
export function MacrosTab() {
  const { settings, updateSettings } = useSettings();

  return (
    <>
      <MacroSplitPicker />

      {settings.showIntakeBars ? (
        <>
          <GroupLabel>Intake bars</GroupLabel>
          <Group>
            <ToggleRow
              title='Protein as a minimum'
              sub='Something to reach, not a limit'
              on={settings.proteinAsMinimum}
              onToggle={(v) => updateSettings({ proteinAsMinimum: v })}
            />
          </Group>
        </>
      ) : null}
    </>
  );
}
