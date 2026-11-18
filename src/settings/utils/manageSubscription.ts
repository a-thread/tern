import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

/** Play opens Tern's subscription directly; the App Store lists them all. */
export function manageSubscription(): Promise<void> {
  if (Platform.OS === 'ios') {
    return Linking.openURL('https://apps.apple.com/account/subscriptions');
  }
  const pkg = Constants.expoConfig?.android?.package;
  return Linking.openURL(
    pkg
      ? `https://play.google.com/store/account/subscriptions?package=${encodeURIComponent(pkg)}`
      : 'https://play.google.com/store/account/subscriptions',
  );
}
