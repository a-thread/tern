import React, { useState } from 'react';
import { Pressable } from 'react-native';

import { GroupLabel, Icon } from '@shared/components/ui';
import { NovaInfoSheet } from '@shared/components/NovaInfoSheet/NovaInfoSheet';
import { colors } from '@shared/theme';

/**
 * The "Food type" heading over the processing-level picker, with an info button that explains
 * each NOVA level and gives examples, so the choice is easier to make.
 */
export function FoodTypeLabel() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <GroupLabel
        accessory={
          <Pressable
            onPress={() => setOpen(true)}
            hitSlop={12}
            accessibilityRole='button'
            accessibilityLabel='About processing levels'
          >
            <Icon
              name='information-outline'
              size={16}
              color={colors.ink3}
            />
          </Pressable>
        }
      >
        Food type
      </GroupLabel>
      <NovaInfoSheet
        visible={open}
        onClose={() => setOpen(false)}
        footnote='Levels 1 and 2 are both logged as Whole. A suggested type comes from Open Food Facts or the kind of food; your choice always wins and is remembered for this food.'
      />
    </>
  );
}
