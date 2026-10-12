import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList, SettingsStackParamList } from './types';

/** Navigation typed for the root stack: the logging flows, Settings and the Today detail screens. */
export const useRootNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();

/** Navigation typed for the Settings stack, for the section pages. */
export const useSettingsNavigation = () =>
  useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
