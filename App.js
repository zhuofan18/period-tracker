import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import LoginScreen          from './screens/LoginScreen';
import CreateAccountScreen  from './screens/CreateAccountScreen';
import GoalsScreen          from './screens/GoalsScreen';
import GeneralInfoScreen    from './screens/GeneralInfoScreen';
import CycleCalendarScreen  from './screens/CycleCalendarScreen';
import HomeScreen           from './screens/HomeScreen';
import DailyLogScreen       from './screens/DailyLogScreen';
import StatisticsScreen     from './screens/StatisticsScreen';
import ProfileSettingsScreen from './screens/ProfileSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor: '#e75480',
        tabBarInactiveTintColor: '#aaa',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Log"
        component={DailyLogScreen}
        options={{
          tabBarLabel: 'Log',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CycleCalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatisticsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileSettingsScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login"          component={LoginScreen} />
        <Stack.Screen name="CreateAccount"  component={CreateAccountScreen} />
        <Stack.Screen name="Goals"          component={GoalsScreen} />
        <Stack.Screen name="GeneralInfo"    component={GeneralInfoScreen} />
        <Stack.Screen name="CycleSetup"     component={CycleCalendarScreen} />
        <Stack.Screen name="MainApp"        component={MainTabs} />
        <Stack.Screen name="Statistics"     component={StatisticsScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
