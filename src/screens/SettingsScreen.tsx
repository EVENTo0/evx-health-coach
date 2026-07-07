import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  StyleSheet, Alert, Platform
} from 'react-native';
import { useAppStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { EVXCard } from '../components/EVXCard';
import { EVXButton } from '../components/EVXButton';
import {
  requestNotificationPermissions,
  scheduleDailyReminders,
  cancelAllNotifications
} from '../services/notifications';
import { isHealthIntegrationAvailable } from '../services/health';
import { supabase } from '../services/supabase';
import { applyRTL } from '../i18n';

export const SettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { user, theme, toggleTheme, setUser, language, setLanguage } = useAppStore();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [workoutReminder, setWorkoutReminder] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [sleepReminder, setSleepReminder] = useState(true);
  const [healthConnected, setHealthConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    isHealthIntegrationAvailable().then(setHealthConnected);
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Blocked',
          'Please enable notifications in your device Settings to receive reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
    } else {
      await cancelAllNotifications();
    }
    setNotifEnabled(value);
  };

  const handleSaveNotifications = async () => {
    if (!notifEnabled) return;
    setSaving(true);
    try {
      await scheduleDailyReminders({
        workoutTime: '07:00',
        mealReminders,
        waterReminders,
        sleepReminder: '22:00',
      });
      Alert.alert('✅ Saved', 'Your notification schedule has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save notifications. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setUser(null);
        },
      },
    ]);
  };


  const handleChangeLanguage = (lang: 'en' | 'ar') => {
    if (lang === language) return;
    setLanguage(lang);
    const { restartRequired } = applyRTL(lang);
    if (restartRequired) {
      Alert.alert(
        lang === 'ar' ? 'إعادة التشغيل مطلوبة' : 'Restart Required',
        lang === 'ar'
          ? 'يرجى إغلاق التطبيق وإعادة فتحه لتطبيق اتجاه الصفحة الجديد (RTL).'
          : 'Please close and reopen the app to apply the new layout direction.',
        [{ text: 'OK' }]
      );
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 24, letterSpacing: -0.5 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { fontSize: 15, color: colors.text, flex: 1 },
    rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    healthBadge: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
      backgroundColor: healthConnected ? '#4CAF5020' : colors.border,
    },
    healthBadgeText: {
      fontSize: 12, fontWeight: '700',
      color: healthConnected ? '#4CAF50' : colors.textSecondary,
    },
    version: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 8, marginBottom: 32 },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <EVXCard>
          <View style={[styles.row, styles.rowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{user?.full_name || 'EVX User'}</Text>
              <Text style={styles.rowSub}>{user?.email ?? ''}</Text>
            </View>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
        </EVXCard>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <EVXCard>
          <View style={[styles.row, styles.rowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Dark Mode</Text>
              <Text style={styles.rowSub}>{isDark ? 'Currently dark' : 'Currently light'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor='#fff'
            />
          </View>
        </EVXCard>
      </View>

      {/* Health Integration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Data</Text>
        <EVXCard>
          <View style={[styles.row, styles.rowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{Platform.OS === 'ios' ? 'Apple Health' : 'Google Health Connect'}</Text>
              <Text style={styles.rowSub}>Steps, calories, sleep, heart rate</Text>
            </View>
            <View style={styles.healthBadge}>
              <Text style={styles.healthBadgeText}>{healthConnected ? 'Connected' : 'Not connected'}</Text>
            </View>
          </View>
        </EVXCard>
      </View>

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language / اللغة</Text>
        <EVXCard>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>English</Text>
            <Switch
              value={language === 'en'}
              onValueChange={() => handleChangeLanguage('en')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor='#fff'
            />
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>العربية (Arabic)</Text>
            <Switch
              value={language === 'ar'}
              onValueChange={() => handleChangeLanguage('ar')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor='#fff'
            />
          </View>
        </EVXCard>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <EVXCard>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Enable Reminders</Text>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor='#fff'
            />
          </View>
          <View style={[styles.row, { opacity: notifEnabled ? 1 : 0.4 }]}>
            <Text style={styles.rowLabel}>Workout Reminder</Text>
            <Switch value={workoutReminder} onValueChange={setWorkoutReminder} disabled={!notifEnabled}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor='#fff' />
          </View>
          <View style={[styles.row, { opacity: notifEnabled ? 1 : 0.4 }]}>
            <Text style={styles.rowLabel}>Meal Reminders</Text>
            <Switch value={mealReminders} onValueChange={setMealReminders} disabled={!notifEnabled}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor='#fff' />
          </View>
          <View style={[styles.row, { opacity: notifEnabled ? 1 : 0.4 }]}>
            <Text style={styles.rowLabel}>Water Reminders</Text>
            <Switch value={waterReminders} onValueChange={setWaterReminders} disabled={!notifEnabled}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor='#fff' />
          </View>
          <View style={[styles.row, styles.rowLast, { opacity: notifEnabled ? 1 : 0.4 }]}>
            <Text style={styles.rowLabel}>Sleep Reminder</Text>
            <Switch value={sleepReminder} onValueChange={setSleepReminder} disabled={!notifEnabled}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor='#fff' />
          </View>
        </EVXCard>
        {notifEnabled && (
          <EVXButton title={saving ? 'Saving...' : 'Save Notification Schedule'} onPress={handleSaveNotifications} style={{ marginTop: 12 }} />
        )}
      </View>

      {/* Sign Out */}
      <EVXButton title='Sign Out' onPress={handleSignOut} variant='ghost' />

      <Text style={styles.version}>EVX v1.0.0 · Built with ❤️</Text>
    </ScrollView>
  );
};

export default SettingsScreen;
