import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font } from '../theme';
import TernMark from '../components/TernMark';
import TodayScreen from '@today/TodayScreen';
import RestDayScreen from '@today/RestDayScreen';
import FoodScreen from '@food/FoodScreen';
import LogFoodStack from '@food/LogFoodStack';
import EditFoodEntryScreen from '@food/logging/EditFoodEntryScreen';
import SaveMealScreen from '@food/logging/SaveMealScreen';
import LogWeightScreen from '@weight/LogWeightScreen';
import TrendsStack from '@trends/TrendsStack';
import JourneyScreen from '@journey/JourneyScreen';
import RewardScreen from '@journey/RewardScreen';
import SettingsStack from '@settings/SettingsStack';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
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
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
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
        options={{ tabBarIcon: ({ color }) => <LeafIcon color={color} /> }}
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
        <RootStack.Screen name='Reward' component={RewardScreen} />
        <RootStack.Screen name='RestDay' component={RestDayScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={21} height={21} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M4 11.5 12 4l8 7.5M6 10v9h12v-9'
      stroke={color}
      strokeWidth={2}
      strokeLinecap='round'
    />
  </Svg>
);

const LeafIcon = ({ color }: { color: string }) => (
  <Svg width={21} height={21} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M12 3c-4 3-6 6-6 9a6 6 0 0 0 12 0c0-3-2-6-6-9z'
      stroke={color}
      strokeWidth={2}
    />
  </Svg>
);

const ChartIcon = ({ color }: { color: string }) => (
  <Svg width={21} height={21} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M4 19V9m6 10V4m6 15v-6'
      stroke={color}
      strokeWidth={2}
      strokeLinecap='round'
    />
  </Svg>
);
