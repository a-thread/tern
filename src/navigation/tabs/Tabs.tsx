import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, typography } from '@shared/theme';
import TernMark from '@shared/components/TernMark';
import TodayScreen from '../../today/TodayScreen';
import FoodScreen from '../../food/FoodScreen';
import TrendsStack from '../../trends/TrendsStack';
import JourneyScreen from '../../journey/JourneyScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';
import { useSettings } from '../../domain/settings/SettingsContext';
import { ChartIcon, FoodIcon, HomeIcon } from './TabIcons';
import { TabAnchorsProvider } from './tabAnchors';
import { AnchoredTabButton } from './AnchoredTabButton';

const TAB_BAR_CONTENT_HEIGHT = 54;
const MIN_TAB_BAR_BOTTOM_INSET = 10;

const Tab = createBottomTabNavigator<TabParamList>();

// Primary Pages
export default function Tabs() {
  // The app draws edge-to-edge, so the bar must make room for the system
  // navigation area itself (a fixed height would sit under it).
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, MIN_TAB_BAR_BOTTOM_INSET);
  // No Food tab for someone who doesn't log food (Settings › Food › Track food).
  const { settings } = useSettings();
  return (
    // Each tab's button sits in a view the tips on Today can measure and point at.
    <TabAnchorsProvider>
      {(anchors) => (
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            freezeOnBlur: true,
            tabBarActiveTintColor: colors.coral,
            tabBarInactiveTintColor: colors.ink3,
            tabBarStyle: {
              backgroundColor: 'rgba(255,255,255,0.94)',
              borderTopColor: colors.border,
              height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
              paddingTop: 8,
              paddingBottom: bottomPadding,
            },
            tabBarLabelStyle: {
              fontFamily: font.medium,
              fontSize: typography.small.fontSize,
            },
          }}
        >
          <Tab.Screen
            name='Today'
            component={TodayScreen}
            options={{
              tabBarIcon: ({ color }) => <HomeIcon color={color} />,
              tabBarButton: (props) => (
                <AnchoredTabButton anchor={anchors.Today} {...props} />
              ),
            }}
          />
          {settings.trackFood ? (
            <Tab.Screen
              name='Food'
              component={FoodScreen}
              options={{
                tabBarIcon: ({ color }) => <FoodIcon color={color} />,
                tabBarButton: (props) => (
                  <AnchoredTabButton anchor={anchors.Food} {...props} />
                ),
              }}
            />
          ) : null}
          <Tab.Screen
            name='Trends'
            component={TrendsStack}
            options={{
              tabBarIcon: ({ color }) => <ChartIcon color={color} />,
              tabBarButton: (props) => (
                <AnchoredTabButton anchor={anchors.Trends} {...props} />
              ),
            }}
          />
          <Tab.Screen
            name='Journey'
            component={JourneyScreen}
            options={{
              tabBarIcon: ({ color }) => <TernMark size={21} color={color} />,
              tabBarButton: (props) => (
                <AnchoredTabButton anchor={anchors.Journey} {...props} />
              ),
            }}
          />
        </Tab.Navigator>
      )}
    </TabAnchorsProvider>
  );
}
