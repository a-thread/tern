import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Opens the store's page for managing Tern Plus: change plan or cancel. Google Play's goes
 * straight to Tern's subscription; the App Store's lists them all.
 */
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
