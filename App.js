import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import SplashView from './components/SplashView';
import { supabase } from './lib/supabase';

// Keep the native splash visible until we call hideAsync()
SplashScreen.preventAutoHideAsync();

// Apply Manrope as the app-wide default so every screen picks it up
// without needing a fontFamily on each individual Text style.
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: 'Manrope_500Medium' }, Text.defaultProps.style];

const navigationRef = createNavigationContainerRef();

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
import LegalScreen           from './screens/LegalScreen';

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
  const [showSplash, setShowSplash]     = useState(true);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInitialRoute(session ? 'MainApp' : 'Login');
      // Hide native splash, then fade out our React splash
      SplashScreen.hideAsync();
      setTimeout(() => SplashView.hide(), 100);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (navigationRef.isReady()) {
          navigationRef.navigate('ResetPassword');
        } else {
          setInitialRoute('ResetPassword');
        }
      } else {
        setInitialRoute(session ? 'MainApp' : 'Login');
      }
    });

    return () => subscription.unsubscribe();
  }, [fontsLoaded]);

  if (!initialRoute) {
    return showSplash ? (
      <SplashView onReady={() => setShowSplash(false)} />
    ) : null;
  }

  return (
    <>
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
          animationDuration: 220,
        }}
      >
        {/* Auth flow */}
        <Stack.Screen name="Login"          component={LoginScreen}          options={{ animation: 'fade' }} />
        <Stack.Screen name="CreateAccount"  component={CreateAccountScreen} />
        <Stack.Screen name="LoginForm"      component={LoginFormScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
        <Stack.Screen name="Legal"          component={LegalScreen} />

        {/* Onboarding flow */}
        <Stack.Screen name="Goals"      component={GoalsScreen} />
        <Stack.Screen name="GeneralInfo" component={GeneralInfoScreen} />
        <Stack.Screen name="CycleSetup"  component={CycleCalendarScreen} />

        {/* Main app — fade in from auth/onboarding */}
        <Stack.Screen name="MainApp" component={MainTabs} options={{ animation: 'fade', animationDuration: 300 }} />

        {/* Modal-style screens slide up from bottom */}
        <Stack.Screen name="Chat"       component={ChatScreen}       options={{ animation: 'slide_from_bottom', animationDuration: 280 }} />
        <Stack.Screen name="LogHistory" component={LogHistoryScreen} options={{ animation: 'slide_from_bottom', animationDuration: 280 }} />

        {/* Kept for backwards compat */}
        <Stack.Screen name="Statistics"      component={StatisticsScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    {showSplash && <SplashView onReady={() => setShowSplash(false)} />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
