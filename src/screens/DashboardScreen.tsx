import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView,
  StyleSheet, RefreshControl
} from 'react-native';
import { useAppStore } from '../store';
import { useTheme } from '../hooks/useTheme';
import { EVXCard } from '../components/EVXCard';
import { EVXLoader } from '../components/EVXLoader';
import { StatRing } from '../components/StatRing';
import { StreakCard } from '../components/StreakCard';
import { SymptomCheckIn } from '../components/SymptomCheckIn';
import { readTodayHealthData, isHealthIntegrationAvailable, syncWearableSnapshot, type HealthSnapshot } from '../services/health';
import { getStreakData, type StreakData } from '../services/streaks';
import { getTodaySymptoms, logSymptoms, type SymptomLog } from '../services/symptoms';
import { supabase } from '../services/supabase';

interface DashboardState {
  health: HealthSnapshot;
  streakData: StreakData | null;
  todayWorkout: boolean;
  todayMeal: boolean;
  todayPlan: boolean;
  todaySymptoms: SymptomLog | null;
}

export const DashboardScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAppStore();
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];

      const [health, available, streakRes, workoutRes, mealRes, planRes, symptomRes] = await Promise.allSettled([
        syncWearableSnapshot(user.id).catch(() => readTodayHealthData()),
        isHealthIntegrationAvailable(),
        getStreakData(user.id),
        supabase.from('workouts').select('id').eq('user_id', user.id).gte('created_at', today).limit(1),
        supabase.from('meal_plans').select('id').eq('user_id', user.id).gte('created_at', today).limit(1),
        supabase.from('daily_plans').select('id').eq('user_id', user.id).eq('date', today).limit(1),
        getTodaySymptoms(user.id),
      ]);

      setHealthAvailable(available.status === 'fulfilled' ? available.value : false);

      setData({
        health: health.status === 'fulfilled' && health.value !== null ? health.value : { date: today },
        streakData: streakRes.status === 'fulfilled' ? streakRes.value : null,
        todayWorkout: workoutRes.status === 'fulfilled' ? (workoutRes.value.data?.length ?? 0) > 0 : false,
        todayMeal: mealRes.status === 'fulfilled' ? (mealRes.value.data?.length ?? 0) > 0 : false,
        todayPlan: planRes.status === 'fulfilled' ? (planRes.value.data?.length ?? 0) > 0 : false,
        todaySymptoms: symptomRes.status === 'fulfilled' ? symptomRes.value : null,
      });
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const handleSymptomSubmit = useCallback(async (symptoms: string[], energyLevel: number) => {
    if (!user) return;
    const log = await logSymptoms(user.id, { symptoms, energy_level: energyLevel });
    setData((prev) => (prev ? { ...prev, todaySymptoms: log } : prev));
  }, [user]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20 },
    header: { marginBottom: 24 },
    greeting: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    checklistRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    checklistIcon: { fontSize: 20, width: 32 },
    checklistLabel: { flex: 1, fontSize: 15, color: colors.text, marginLeft: 8 },
    checklistStatus: { fontSize: 13, fontWeight: '600' },
    healthBanner: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 20, alignItems: 'center' },
    healthBannerText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  });

  if (loading) return <EVXLoader />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'Champion';

  const checklist = [
    { icon: '💪', label: 'Workout generated', done: data?.todayWorkout ?? false },
    { icon: '🥗', label: 'Meal plan ready', done: data?.todayMeal ?? false },
    { icon: '📋', label: 'Daily plan set', done: data?.todayPlan ?? false },
  ];

  const streak = data?.streakData?.current_streak ?? 0;
  const xp = data?.streakData?.xp_total ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      <StreakCard streak={data?.streakData ?? { current_streak: 0, longest_streak: 0, last_active_date: null, total_active_days: 0, xp_total: 0, level: 1, badges: [] }} />

      <SymptomCheckIn onSubmit={handleSymptomSubmit} alreadyLoggedToday={!!data?.todaySymptoms} />

      {healthAvailable && data?.health && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Health</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <StatRing
                label="Steps"
                value={(data.health.steps ?? 0).toLocaleString()}
                progress={Math.min((data.health.steps ?? 0) / 10000, 1)}
                color={colors.primary}
                size={56}
              />
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            <View style={styles.statCard}>
              <StatRing
                label="Calories"
                value={Math.round(data.health.activeCalories ?? 0)}
                progress={Math.min((data.health.activeCalories ?? 0) / 600, 1)}
                color='#FF6B35'
                size={56}
              />
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statCard}>
              <StatRing
                label="Sleep"
                value={`${(data.health.sleepHours ?? 0).toFixed(1)}h`}
                progress={Math.min((data.health.sleepHours ?? 0) / 9, 1)}
                color='#7B61FF'
                size={56}
              />
              <Text style={styles.statLabel}>Sleep</Text>
            </View>
          </View>
        </View>
      )}

      {!healthAvailable && (
        <View style={styles.healthBanner}>
          <Text style={{ fontSize: 28 }}>📊</Text>
          <Text style={styles.healthBannerText}>Connect Apple Health or Google Fit in Settings to see your live health data.</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Checklist</Text>
        <EVXCard>
          {checklist.map((item, i) => (
            <View key={i} style={[styles.checklistRow, i === checklist.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.checklistIcon}>{item.icon}</Text>
              <Text style={styles.checklistLabel}>{item.label}</Text>
              <Text style={[styles.checklistStatus, { color: item.done ? '#4CAF50' : colors.textSecondary }]}>
                {item.done ? '✓ Done' : 'Pending'}
              </Text>
            </View>
          ))}
        </EVXCard>
      </View>

      {healthAvailable && (data?.health.restingHeartRate ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recovery</Text>
          <EVXCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}>
              <Text style={{ fontSize: 32 }}>❤️</Text>
              <View style={{ marginLeft: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>{data?.health.restingHeartRate} bpm</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Resting heart rate</Text>
              </View>
            </View>
          </EVXCard>
        </View>
      )}
    </ScrollView>
  );
};

export default DashboardScreen;
