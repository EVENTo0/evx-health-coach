import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store';
import { supabase } from '../services/supabase';
import { healthProfileService } from '../services/supabase';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { LabScreen } from '../screens/LabScreen';
import { DailyPlanScreen } from '../screens/DailyPlanScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: '🏠', inactive: '🏠' },
  Workouts: { active: '🏋️', inactive: '🏋️' },
  Nutrition: { active: '🥗', inactive: '🥗' },
  Labs: { active: '🔬', inactive: '🔬' },
  DailyPlan: { active: '📋', inactive: '📋' },
  Progress: { active: '📈', inactive: '📈' },
  Settings: { active: '⚙️', inactive: '⚙️' },
};

const MainTabs = () => {
  const { colors, fontSize } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20 }}>
            {focused ? TAB_ICONS[route.name]?.active : TAB_ICONS[route.name]?.inactive}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Workouts" component={WorkoutScreen} options={{ title: 'Fit' }} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} options={{ title: 'Nutrition' }} />
      <Tab.Screen name="DailyPlan" component={DailyPlanScreen} options={{ title: 'Coach' }} />
      <Tab.Screen name="Labs" component={LabScreen} options={{ title: 'Lab' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { colors } = useTheme();
  const { user, healthProfile, setUser, setHealthProfile } = useAppStore();
  const [appState, setAppState] = useState<'splash' | 'auth' | 'onboarding' | 'main'>('splash');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name,
          created_at: session.user.created_at,
        });
        const profile = await healthProfileService.get(session.user.id);
        setHealthProfile(profile);
        setAppState(profile?.onboarding_completed ? 'main' : 'onboarding');
      } else {
        setUser(null);
        setHealthProfile(null);
        if (appState !== 'splash') setAppState('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (appState === 'splash') {
    return (
      <SplashScreen onFinish={() => setAppState(user ? (healthProfile?.onboarding_completed ? 'main' : 'onboarding') : 'auth')} />
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {appState === 'auth' && (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onAuthenticated={() => setAppState(healthProfile?.onboarding_completed ? 'main' : 'onboarding')} />}
          </Stack.Screen>
        )}
        {appState === 'onboarding' && (
          <Stack.Screen name="Onboarding">
            {(props) => <OnboardingScreen {...props} onComplete={() => setAppState('main')} />}
          </Stack.Screen>
        )}
        {appState === 'main' && (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
