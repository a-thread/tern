import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@shared/theme';

export function Radio({ on }: { on: boolean }) {
  return <View style={[s.radio, on && s.radioOn]} />;
}

const s = StyleSheet.create({
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: 1,
  },
  radioOn: { borderWidth: 5, borderColor: colors.coral },
});
