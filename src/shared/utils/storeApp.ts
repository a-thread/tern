import { Platform } from 'react-native';

/** Where Tern Plus is bought and managed, as said mid-sentence: "cancel in Google Play". */
export const storeName = () => (Platform.OS === 'ios' ? 'the App Store' : 'Google Play');
