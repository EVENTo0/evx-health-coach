import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { supabase } from './src/services/supabase';
import { useAppStore } from './src/store';
import { applyRTL } from './src/i18n';
import { applySmartScheduleFromProfile } from './src/services/notifications';
import { supabase as supabaseClient } from './src/services/supabase';

// Parses tokens out of a Supabase auth deep link, whether they arrive
// as query params (?access_token=...) or a URL fragment (#access_token=...)
function parseAuthParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const paramsStr = hashIndex >= 0 ? url.slice(hashIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : '';
  const params: Record<string, string> = {};
  paramsStr.split('&').forEach((pair) => {
    if (!pair) return;
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
  });
  return params;
}

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Enforce correct text direction (LTR/RTL) as early as possible on boot,
  // based on the persisted language preference (e.g. Arabic -> RTL).
  useEffect(() => {
    applyRTL(language as 'en' | 'ar');
  }, []);

  // Apply smart notification schedule whenever user logs in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('health_profiles')
          .select('training_start_time, training_end_time, sleep_hours_target, training_days')
          .eq('user_id', session.user.id)
          .single();
        if (profile) {
          applySmartScheduleFromProfile(profile).catch(() => null);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuthDeepLink = async (url: string | null) => {
    if (!url) return;
    if (!url.includes('access_token') && !url.includes('type=recovery')) return;

    const params = parseAuthParams(url);
    if (params.access_token && params.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (!error && params.type === 'recovery') {
        setShowResetPassword(true);
      }
    }
  };

  useEffect(() => {
    // App opened fresh via the reset-password link
    Linking.getInitialURL().then(handleAuthDeepLink);

    // App already running in background when link is tapped
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthDeepLink(url));
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        {showResetPassword ? (
          <ResetPasswordScreen onDone={() => setShowResetPassword(false)} />
        ) : (
          <AppNavigator />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
