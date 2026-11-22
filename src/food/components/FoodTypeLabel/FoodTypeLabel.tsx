import React, { useState } from 'react';

import { GroupLabel, InfoDot } from '@shared/components/ui';
import { NovaInfoSheet } from '@shared/components/NovaInfoSheet/NovaInfoSheet';

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
