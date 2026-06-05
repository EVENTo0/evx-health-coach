import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store';
import { progressService, workoutService, nutritionService, dailyPlanService } from '../services/supabase';
import { EVXCard } from '../components/EVXCard';
import { StatRing } from '../components/StatRing';
import { EVXLoader } from '../components/EVXLoader';
import type { ProgressLog, WorkoutPlan, NutritionPlan, DailyPlan } from '../types';

interface Props { navigation: any; }

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, healthProfile } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latestLog, setLatestLog] = useState<ProgressLog | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutPlan | null>(null);
  const [todayMeals, setTodayMeals] = useState<NutritionPlan | null>(null);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    if (!user) return;
    try {
      const [log, workouts, meals, plan] = await Promise.all([
        progressService.getLatest(user.id),
        workoutService.list(user.id),
        nutritionService.getByDate(user.id, today),
        dailyPlanService.getByDate(user.id, today),
      ]);
      setLatestLog(log);
      setTodayWorkout(workouts.find(w => w.scheduled_date === today) || workouts[0] || null);
      setTodayMeals(meals);
      setTodayPlan(plan);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const bmi = healthProfile
    ? (healthProfile.weight_kg / Math.pow(healthProfile.height_cm / 100, 2)).toFixed(1)
    : '—';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <EVXLoader fullScreen message="Loading your dashboard..." />;

  const QuickAction = ({ icon, label, screen, color }: any) => (
    <TouchableOpacity
      onPress={() => navigation.navigate(screen)}
      activeOpacity={0.7}
      style={[
        styles.quickAction,
        { backgroundColor: `${color}15`, borderColor: `${color}30`, borderRadius: radius.xl },
      ]}
    >
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '600', marginTop: 6, textAlign: 'center' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, backgroundColor: colors.bg }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary, fontSize: fontSize.sm }]}>
            {greeting()},
          </Text>
          <Text style={[styles.userName, { color: colors.text, fontSize: fontSize.xxl }]}>
            {user?.full_name?.split(' ')[0] || 'Athlete'} 👋
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.md }}>
            {user?.full_name?.[0] || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <EVXCard style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }} glowColor={colors.primary}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
          TODAY'S STATS
        </Text>
        <View style={styles.statsRow}>
          <StatRing
            label="Water"
            value={latestLog?.water_intake_liters?.toFixed(1) || '0'}
            unit="L"
            progress={(latestLog?.water_intake_liters || 0) / (healthProfile?.sleep_hours_target || 3)}
            color={colors.info}
          />
          <StatRing
            label="Weight"
            value={latestLog?.weight_kg || healthProfile?.weight_kg || '—'}
            unit="kg"
            progress={0.7}
            color={colors.accentGreen}
          />
          <StatRing
            label="Sleep"
            value={latestLog?.sleep_hours || '—'}
            unit="hr"
            progress={(latestLog?.sleep_hours || 0) / (healthProfile?.sleep_hours_target || 8)}
            color={colors.accentPurple}
          />
          <StatRing
            label="Energy"
            value={latestLog?.energy_level || '—'}
            unit="/10"
            progress={(latestLog?.energy_level || 0) / 10}
            color={colors.warning}
          />
        </View>
      </EVXCard>

      {/* BMI Card */}
      <EVXCard style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
        <View style={styles.bmiRow}>
          <View>
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.xs }]}>BMI</Text>
            <Text style={[{ color: colors.text, fontSize: fontSize.xxxl, fontWeight: '800' }]}>{bmi}</Text>
            <Text style={[{ color: colors.accentGreen, fontSize: fontSize.xs, fontWeight: '600' }]}>Normal range</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 24 }}>
            <View style={styles.bmiBar}>
              {['#00E096', '#FFB800', '#FF6B35', '#FF4444'].map((c, i) => (
                <View key={i} style={[styles.bmiSegment, { backgroundColor: c }]} />
              ))}
            </View>
            <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xs, marginTop: 4 }]}>
              Goal: {healthProfile?.primary_goal?.replace('_', ' ')} •  {healthProfile?.weight_kg}kg
            </Text>
          </View>
        </View>
      </EVXCard>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
          QUICK ACCESS
        </Text>
        <View style={styles.quickGrid}>
          <QuickAction icon="🏋️" label="EVX Fit" screen="Workouts" color={colors.primary} />
          <QuickAction icon="🥗" label="Nutrition" screen="Nutrition" color={colors.accentGreen} />
          <QuickAction icon="🔬" label="Lab Upload" screen="Labs" color={colors.accentPurple} />
          <QuickAction icon="📋" label="Daily Plan" screen="DailyPlan" color={colors.warning} />
          <QuickAction icon="📈" label="Progress" screen="Progress" color={colors.accent} />
          <QuickAction icon="⚙️" label="Settings" screen="Settings" color={colors.textTertiary} />
        </View>
      </View>

      {/* Today's Workout */}
      {todayWorkout && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
            TODAY'S WORKOUT
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Workouts')} activeOpacity={0.85}>
            <EVXCard glowColor={colors.primary} style={{ marginTop: 8 }}>
              <View style={styles.workoutRow}>
                <Text style={{ fontSize: 32 }}>🏋️</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[{ color: colors.text, fontWeight: '700', fontSize: fontSize.md }]}>
                    {todayWorkout.title}
                  </Text>
                  <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 }]}>
                    {todayWorkout.duration_minutes} min • {todayWorkout.type} • {todayWorkout.difficulty}
                  </Text>
                </View>
                <View style={[
                  styles.badge,
                  { backgroundColor: todayWorkout.completed ? `${colors.accentGreen}20` : `${colors.primary}20` },
                ]}>
                  <Text style={{ color: todayWorkout.completed ? colors.accentGreen : colors.primary, fontSize: fontSize.xs, fontWeight: '700' }}>
                    {todayWorkout.completed ? '✓ Done' : 'Start →'}
                  </Text>
                </View>
              </View>
            </EVXCard>
          </TouchableOpacity>
        </View>
      )}

      {/* Daily Plan preview */}
      {todayPlan && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
            TODAY'S SCHEDULE
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('DailyPlan')} activeOpacity={0.85}>
            <EVXCard style={{ marginTop: 8 }}>
              <Text style={[{ color: colors.primary, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 8 }]}>
                🤖 {todayPlan.motivational_note}
              </Text>
              {todayPlan.timeline.slice(0, 4).map((item, i) => (
                <View key={i} style={[styles.timelineItem, { borderLeftColor: `${colors.primary}40` }]}>
                  <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xs, width: 44 }]}>{item.time}</Text>
                  <Text style={[{ color: colors.text, fontSize: fontSize.sm, flex: 1 }]}>{item.activity}</Text>
                </View>
              ))}
              <Text style={[{ color: colors.primary, fontSize: fontSize.xs, marginTop: 8, fontWeight: '600' }]}>
                View full plan →
              </Text>
            </EVXCard>
          </TouchableOpacity>
        </View>
      )}

      {/* Nutrition summary */}
      {todayMeals && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
            NUTRITION TODAY
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Nutrition')} activeOpacity={0.85}>
            <EVXCard style={{ marginTop: 8 }} glowColor={colors.accentGreen}>
              <View style={styles.macroRow}>
                {[
                  { label: 'Calories', value: todayMeals.total_calories, color: colors.warning, unit: 'kcal' },
                  { label: 'Protein', value: `${todayMeals.total_protein_g}g`, color: colors.primary, unit: '' },
                  { label: 'Carbs', value: `${todayMeals.total_carbs_g}g`, color: colors.accentGreen, unit: '' },
                  { label: 'Fat', value: `${todayMeals.total_fat_g}g`, color: colors.accent, unit: '' },
                ].map(m => (
                  <View key={m.label} style={{ alignItems: 'center' }}>
                    <Text style={{ color: m.color, fontWeight: '800', fontSize: fontSize.lg }}>{m.value}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs }}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </EVXCard>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state CTA */}
      {!todayWorkout && !todayMeals && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <EVXCard glowColor={colors.primary} style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🚀</Text>
            <Text style={[{ color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginBottom: 8, textAlign: 'center' }]}>
              Ready to start?
            </Text>
            <Text style={[{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20, fontSize: fontSize.sm }]}>
              Generate your first AI workout or meal plan to get started.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Workouts')}
              style={[styles.ctaBtn, { backgroundColor: colors.primary, borderRadius: radius.lg }]}
            >
              <Text style={{ color: '#000', fontWeight: '700', fontSize: fontSize.md }}>Generate Workout →</Text>
            </TouchableOpacity>
          </EVXCard>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
  },
  greeting: {},
  userName: { fontWeight: '800', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  quickAction: {
    width: '30%', aspectRatio: 1, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  bmiRow: { flexDirection: 'row', alignItems: 'center' },
  bmiBar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2 },
  bmiSegment: { flex: 1 },
  workoutRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  timelineItem: {
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 2, paddingLeft: 10, paddingVertical: 4, marginBottom: 4,
  },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 14 },
});
