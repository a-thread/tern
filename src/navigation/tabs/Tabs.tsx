import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space, typography } from '@shared/theme';
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
import { TabPill } from './TabPill';

class TabBarLayout {
  static readonly CONTENT_HEIGHT = 54;
  /** Without a system inset (a home button phone), the labels still don't touch the edge. */
  static readonly MIN_BOTTOM = 10;
  /** Keeps the labels clear of Android's gesture handle, which sits inside the inset. */
  static readonly ABOVE_INSET = space.sm;
}

const Tab = createBottomTabNavigator<TabParamList>();

// Primary Pages
export default function Tabs() {
  // The app draws edge-to-edge, so the bar must make room for the system
  // navigation area itself (a fixed height would sit under it).
  const insets = useSafeAreaInsets();
  const bottomPadding =
    insets.bottom > 0
      ? insets.bottom + TabBarLayout.ABOVE_INSET
      : TabBarLayout.MIN_BOTTOM;
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
              height: TabBarLayout.CONTENT_HEIGHT + bottomPadding,
              paddingTop: 8,
              paddingBottom: bottomPadding,
            },
            // Wide screens default to labels beside the icon, whose margins push a stacked label off centre.
            tabBarLabelPosition: 'below-icon',
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
              tabBarIcon: ({ color, focused }) => (
                <TabPill focused={focused}>
                  <HomeIcon color={color} />
                </TabPill>
              ),
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
                tabBarIcon: ({ color, focused }) => (
                  <TabPill focused={focused}>
                    <FoodIcon color={color} />
                  </TabPill>
                ),
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
              tabBarIcon: ({ color, focused }) => (
                <TabPill focused={focused}>
                  <ChartIcon color={color} />
                </TabPill>
              ),
              tabBarButton: (props) => (
                <AnchoredTabButton anchor={anchors.Trends} {...props} />
              ),
            }}
          />
          <Tab.Screen
            name='Journey'
            component={JourneyScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <TabPill focused={focused}>
                  <TernMark size={21} color={color} />
                </TabPill>
              ),
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
