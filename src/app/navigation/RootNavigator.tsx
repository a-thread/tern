import React from 'react';
import { Icon } from '@shared/components/ui';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font } from '@shared/theme';
import TernMark from '@shared/components/TernMark';
import TodayScreen from '@today/screens/TodayScreen';
import RestDayScreen from '@today/screens/RestDayScreen';
import FoodScreen from '@food/screens/FoodScreen';
import LogFoodStack from '@food/screens/logging/LogFoodStack';
import EditFoodEntryScreen from '@food/screens/logging/EditFoodEntryScreen';
import SaveMealScreen from '@food/screens/logging/SaveMealScreen';
import LogWeightScreen from '@weight/screens/LogWeightScreen';
import CheckInScreen from '@mood/screens/CheckInScreen';
import MovementStack from '@movement/screens/MovementStack';
import TrendsStack from '@trends/screens/TrendsStack';
import JourneyScreen from '@journey/screens/JourneyScreen';
import WaypointsScreen from '@journey/screens/WaypointsScreen';
import MilestoneScreen from '@journey/screens/MilestoneScreen';
import SettingsStack from './SettingsStack';
import type { RootStackParamList, TabParamList } from '@shared/navigation/types';

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  // The app draws edge-to-edge, so the bar must make room for the system
  // navigation area itself (a fixed height would sit under it).
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.94)',
          borderTopColor: colors.border,
          height: 54 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
        },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 10 },
      }}
    >
      <Tab.Screen
        name='Today'
        component={TodayScreen}
        options={{ tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}
      />
      <Tab.Screen
        name='Food'
        component={FoodScreen}
        options={{ tabBarIcon: ({ color }) => <FoodIcon color={color} /> }}
      />
      <Tab.Screen
        name='Trends'
        component={TrendsStack}
        options={{ tabBarIcon: ({ color }) => <ChartIcon color={color} /> }}
      />
      <Tab.Screen
        name='Journey'
        component={JourneyScreen}
        options={{
          tabBarIcon: ({ color }) => <TernMark size={21} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false, freezeOnBlur: true }}
    >
      <RootStack.Screen name='Tabs' component={Tabs} />

      <RootStack.Group screenOptions={{ presentation: 'modal' }}>
        <RootStack.Screen name='LogFood' component={LogFoodStack} />
        <RootStack.Screen name='LogWeight' component={LogWeightScreen} />
        <RootStack.Screen name='CheckIn' component={CheckInScreen} />
        <RootStack.Screen name='LogMovement' component={MovementStack} />
        <RootStack.Screen name='EditFood' component={EditFoodEntryScreen} />
        <RootStack.Screen name='SaveMeal' component={SaveMealScreen} />
        <RootStack.Screen name='Settings' component={SettingsStack} />
      </RootStack.Group>

      <RootStack.Group
        screenOptions={{
          presentation: 'transparentModal',
          animation: 'fade',
          freezeOnBlur: false,
        }}
      >
        <RootStack.Screen name='Waypoints' component={WaypointsScreen} />
        <RootStack.Screen name='Milestone' component={MilestoneScreen} />
        <RootStack.Screen name='RestDay' component={RestDayScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

const HomeIcon = ({ color }: { color: string }) => (
  <Icon name='home-outline' size={23} color={color} />
);

const FoodIcon = ({ color }: { color: string }) => (
  <Icon name='silverware-fork-knife' size={23} color={color} />
);

const ChartIcon = ({ color }: { color: string }) => (
  <Icon name='chart-bar' size={23} color={color} />
);
