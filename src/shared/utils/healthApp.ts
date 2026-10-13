import { Platform } from 'react-native';

/** The phone's own health store: Apple Health on iPhone, Health Connect on Android. */
export const healthAppName = () => (Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect');

/** Where someone goes to take Tern's access away again. */
export const healthAccessPath = () =>
  Platform.OS === 'ios' ? 'Settings > Health > Data Access & Devices > Tern' : 'Health Connect';
