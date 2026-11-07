jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Icon fonts load through native modules jest doesn't have; a glyph stands in as its name.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name }) => React.createElement(Text, { accessibilityElementsHidden: true }, `[${name}]`);
  return new Proxy({}, { get: () => Icon });
});

// Notification taps go through a native module jest doesn't have; no tap has happened.
jest.mock('expo-notifications', () => ({
  __esModule: true,
  ...jest.requireActual('expo-notifications'),
  useLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: () => {},
}));
