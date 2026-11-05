import React, { useState } from 'react';

import { GroupLabel, InfoDot } from '@shared/components/ui';
import { NovaInfoSheet } from '@shared/components/NovaInfoSheet/NovaInfoSheet';

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
          <InfoDot
            label='About processing levels'
            onPress={() => setOpen(true)}
          />
        }
      >
        Food type
      </GroupLabel>
      <NovaInfoSheet
        visible={open}
        onClose={() => setOpen(false)}
        footnote='A suggested type comes from Open Food Facts or the kind of food; your choice always wins and is remembered for this food.'
      />
    </>
  );
}
