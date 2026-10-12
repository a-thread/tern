import React from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '../../shared/theme';

export function LinkColumn({ children }: { children: React.ReactNode }) {
  return <View style={s.links}>{children}</View>;
}

const s = StyleSheet.create({
  links: { alignItems: 'center', gap: space.md, marginTop: space.lg },
});
