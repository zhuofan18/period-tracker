import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { supabase } from './lib/supabase';

import { ThemeProvider, useTheme } from './context/ThemeContext';

import LoginScreen           from './screens/LoginScreen';
import CreateAccountScreen   from './screens/CreateAccountScreen';
import LoginFormScreen       from './screens/LoginFormScreen';
import ForgotPasswordScreen  from './screens/ForgotPasswordScreen';
import ResetPasswordScreen   from './screens/ResetPasswordScreen';
import GoalsScreen           from './screens/GoalsScreen';
import GeneralInfoScreen     from './screens/GeneralInfoScreen';
import CycleCalendarScreen   from './screens/CycleCalendarScreen';
import CalendarScreen        from './screens/CalendarScreen';
import HomeScreen            from './screens/HomeScreen';
import DailyLogScreen        from './screens/DailyLogScreen';
import StatisticsScreen      from './screens/StatisticsScreen';
import ProfileSettingsScreen from './screens/ProfileSettingsScreen';
import ChatScreen            from './screens/ChatScreen';
import LogHistoryScreen      from './screens/LogHistoryScreen';

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
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.tabBorder,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}            options={{ tabBarLabel: 'Home',     tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen name="Log"      component={DailyLogScreen}        options={{ tabBarLabel: 'Log',      tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} /> }} />
      <Tab.Screen name="Calendar" component={CalendarScreen}        options={{ tabBarLabel: 'Calendar', tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} /> }} />
      <Tab.Screen name="Stats"    component={StatisticsScreen}      options={{ tabBarLabel: 'Stats',    tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }} />
      <Tab.Screen name="Profile"  component={ProfileSettingsScreen} options={{ tabBarLabel: 'Profile',  tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { theme } = useTheme();
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInitialRoute(session ? 'MainApp' : 'Login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setInitialRoute(session ? 'MainApp' : 'Login');
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="Login"           component={LoginScreen} />
        <Stack.Screen name="CreateAccount"   component={CreateAccountScreen} />
        <Stack.Screen name="LoginForm"       component={LoginFormScreen} />
        <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword"   component={ResetPasswordScreen} />
        <Stack.Screen name="Goals"           component={GoalsScreen} />
        <Stack.Screen name="GeneralInfo"     component={GeneralInfoScreen} />
        <Stack.Screen name="CycleSetup"      component={CycleCalendarScreen} />
        <Stack.Screen name="MainApp"         component={MainTabs} />
        <Stack.Screen name="Chat"            component={ChatScreen} />
        <Stack.Screen name="LogHistory"      component={LogHistoryScreen} />
        <Stack.Screen name="Statistics"      component={StatisticsScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
