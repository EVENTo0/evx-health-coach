import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store';
import { dailyPlanService } from '../services/supabase';
import { generateDailyPlan } from '../services/ai';
import { EVXCard } from '../components/EVXCard';
import { EVXButton } from '../components/EVXButton';
import { EVXLoader } from '../components/EVXLoader';
import type { DailyPlan, TimelineItem } from '../types';

interface Props { navigation?: any; }

const ACTIVITY_ICONS: Record<string, string> = {
  sleep: '😴',
  meal: '🍽️',
  workout: '🏋️',
  work: '💼',
  recovery: '🧘',
  hydration: '💧',
  supplement: '💊',
  other: '📌',
};

const ACTIVITY_COLORS: Record<string, string> = {
  sleep: '#A855F7',
  meal: '#00E096',
  workout: '#00D4FF',
  work: '#FFB800',
  recovery: '#A855F7',
  hydration: '#00D4FF',
  supplement: '#FF6B35',
  other: '#808080',
};

export const DailyPlanScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, healthProfile } = useAppStore();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      dailyPlanService.getByDate(user.id, today)
        .then(setPlan)
        .finally(() => setLoading(false));
    }
  }, []);

  const handleGenerate = async () => {
    if (!healthProfile) {
      Alert.alert('Profile needed', 'Complete onboarding first.');
      return;
    }
    setGenerating(true);
    try {
      const aiPlan = await generateDailyPlan(healthProfile, { has_workout: false, has_meal_plan: false });
      const saved = await dailyPlanService.create({
        user_id: user!.id,
        date: today,
        timeline: aiPlan.timeline || [],
        priorities: aiPlan.priorities || [],
        recovery_reminders: aiPlan.recovery_reminders || [],
        motivational_note: aiPlan.motivational_note || 'Make today count!',
      });
      setPlan(saved);
    } catch (err: any) {
      Alert.alert('Generation failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <EVXLoader fullScreen message="Loading your daily plan..." />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xxxl }]}>EVX Coach 📋</Text>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm }]}>
          {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <EVXButton
        title={generating ? 'Generating Plan...' : "✦ Generate Today's Plan"}
        onPress={handleGenerate}
        loading={generating}
        style={{ marginBottom: 24 }}
      />

      {plan ? (
        <>
          {/* Motivational note */}
          <EVXCard glowColor={colors.primary} style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontStyle: 'italic' }}>
              ✨ {plan.motivational_note}
            </Text>
          </EVXCard>

          {/* Priorities */}
          {plan.priorities?.length > 0 && (
            <EVXCard style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.md, marginBottom: 10 }}>
                🎯 Today's Priorities
              </Text>
              {plan.priorities.map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
                  <Text style={{ color: colors.primary, fontWeight: '700', marginRight: 8, fontSize: fontSize.sm }}>
                    {i + 1}.
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, flex: 1 }}>{p}</Text>
                </View>
              ))}
            </EVXCard>
          )}

          {/* Timeline */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DAILY TIMELINE</Text>
          <View style={styles.timeline}>
            {plan.timeline.map((item: TimelineItem, i: number) => {
              const color = ACTIVITY_COLORS[item.type] || colors.textTertiary;
              const isLast = i === plan.timeline.length - 1;
              return (
                <View key={i} style={styles.timelineRow}>
                  {/* Line */}
                  <View style={styles.lineContainer}>
                    <View style={[styles.dot, { backgroundColor: color, borderColor: `${color}40` }]} />
                    {!isLast && <View style={[styles.line, { backgroundColor: `${color}25` }]} />}
                  </View>
                  {/* Content */}
                  <EVXCard style={{ flex: 1, marginLeft: 12, marginBottom: 8, padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: item.notes ? 4 : 0 }}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>{ACTIVITY_ICONS[item.type]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.sm }}>{item.activity}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                          <Text style={{ color, fontSize: fontSize.xs, fontWeight: '700' }}>{item.time}</Text>
                          {item.duration_minutes && (
                            <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs }}>
                              {item.duration_minutes}m
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    {item.notes && (
                      <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs, marginLeft: 26 }}>
                        {item.notes}
                      </Text>
                    )}
                  </EVXCard>
                </View>
              );
            })}
          </View>

          {/* Recovery Reminders */}
          {plan.recovery_reminders?.length > 0 && (
            <EVXCard style={{ marginTop: 8 }}>
              <Text style={{ color: colors.accentGreen, fontWeight: '700', fontSize: fontSize.sm, marginBottom: 10 }}>
                🌿 Recovery Reminders
              </Text>
              {plan.recovery_reminders.map((r, i) => (
                <Text key={i} style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 6 }}>
                  • {r}
                </Text>
              ))}
            </EVXCard>
          )}
        </>
      ) : (
        <EVXCard style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
          <Text style={[{ color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: 8 }]}>
            No plan for today
          </Text>
          <Text style={[{ color: colors.textSecondary, textAlign: 'center', fontSize: fontSize.sm }]}>
            Generate a full daily schedule optimized for your work, training, meals, and recovery.
          </Text>
        </EVXCard>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { paddingTop: 56, paddingBottom: 16 },
  title: { fontWeight: '800' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  lineContainer: { alignItems: 'center', width: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, zIndex: 1, marginTop: 14 },
  line: { width: 2, flex: 1, minHeight: 20 },
});
