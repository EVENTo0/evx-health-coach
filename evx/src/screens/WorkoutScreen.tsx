import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store';
import { workoutService } from '../services/supabase';
import { generateWorkout } from '../services/ai';
import { EVXCard } from '../components/EVXCard';
import { EVXButton } from '../components/EVXButton';
import { EVXLoader } from '../components/EVXLoader';
import type { WorkoutPlan } from '../types';

interface Props { navigation: any; }

export const WorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, healthProfile } = useAppStore();
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    if (user) {
      workoutService.list(user.id)
        .then(setWorkouts)
        .finally(() => setLoading(false));
    }
  }, []);

  const handleGenerate = async () => {
    if (!healthProfile) {
      Alert.alert('Complete onboarding first', 'We need your health profile to generate a workout.');
      return;
    }
    setGenerating(true);
    try {
      const aiWorkout = await generateWorkout(healthProfile);
      const saved = await workoutService.create({
        user_id: user!.id,
        title: aiWorkout.title || 'AI Workout',
        type: aiWorkout.type || 'strength',
        duration_minutes: aiWorkout.duration_minutes || 60,
        difficulty: aiWorkout.difficulty || healthProfile.fitness_level,
        warm_up: aiWorkout.warm_up || [],
        main_exercises: aiWorkout.main_exercises || [],
        cool_down: aiWorkout.cool_down || [],
        notes: aiWorkout.notes || '',
        completed: false,
        scheduled_date: new Date().toISOString().split('T')[0],
      });
      setWorkouts([saved, ...workouts]);
      setSelected(saved);
    } catch (err: any) {
      Alert.alert('Generation failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (id: string) => {
    await workoutService.markCompleted(id);
    setWorkouts(workouts.map(w => w.id === id ? { ...w, completed: true } : w));
    if (selected?.id === id) setSelected({ ...selected, completed: true });
  };

  const typeColors: Record<string, string> = {
    strength: colors.primary,
    cardio: colors.accentGreen,
    hiit: colors.accent,
    flexibility: colors.accentPurple,
    recovery: colors.warning,
  };

  if (loading) return <EVXLoader fullScreen message="Loading workouts..." />;

  if (selected) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Text style={{ color: colors.primary, fontSize: 22 }}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Workout header */}
        <EVXCard glowColor={typeColors[selected.type] || colors.primary} style={{ marginTop: 8 }}>
          <Text style={[{ color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' }]}>{selected.title}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[selected.type, `${selected.duration_minutes} min`, selected.difficulty].map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: `${typeColors[selected.type] || colors.primary}20` }]}>
                <Text style={{ color: typeColors[selected.type] || colors.primary, fontSize: fontSize.xs, fontWeight: '600' }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
          {selected.notes && (
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 10 }}>{selected.notes}</Text>
          )}
        </EVXCard>

        {/* Warm Up */}
        {selected.warm_up?.length > 0 && (
          <Section title="🔥 Warm Up" items={selected.warm_up} accentColor={colors.warning} colors={colors} fontSize={fontSize} />
        )}

        {/* Main Exercises */}
        {selected.main_exercises?.length > 0 && (
          <Section title="💪 Main Workout" items={selected.main_exercises} accentColor={colors.primary} colors={colors} fontSize={fontSize} />
        )}

        {/* Cool Down */}
        {selected.cool_down?.length > 0 && (
          <Section title="🧘 Cool Down" items={selected.cool_down} accentColor={colors.accentGreen} colors={colors} fontSize={fontSize} />
        )}

        {!selected.completed && (
          <EVXButton
            title="✓ Mark as Complete"
            onPress={() => handleComplete(selected.id)}
            style={{ marginTop: 24 }}
          />
        )}
        {selected.completed && (
          <View style={[styles.completedBadge, { backgroundColor: `${colors.accentGreen}15`, borderRadius: radius.lg }]}>
            <Text style={{ color: colors.accentGreen, fontWeight: '700', fontSize: fontSize.md }}>
              ✓ Workout Completed!
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xxxl }]}>EVX Fit 🏋️</Text>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm }]}>
          AI-generated workouts tailored to you
        </Text>
      </View>

      <EVXButton
        title={generating ? 'Generating AI Workout...' : '✦ Generate AI Workout'}
        onPress={handleGenerate}
        loading={generating}
        style={{ marginTop: 8, marginBottom: 24 }}
      />

      {workouts.length === 0 ? (
        <EVXCard style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🏋️</Text>
          <Text style={[{ color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: 8 }]}>
            No workouts yet
          </Text>
          <Text style={[{ color: colors.textSecondary, textAlign: 'center', fontSize: fontSize.sm }]}>
            Tap "Generate AI Workout" and EVX will build a personalized plan for you.
          </Text>
        </EVXCard>
      ) : (
        workouts.map(w => (
          <TouchableOpacity key={w.id} onPress={() => setSelected(w)} activeOpacity={0.85}>
            <EVXCard
              style={{ marginBottom: 12 }}
              glowColor={w.completed ? undefined : typeColors[w.type]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.typeIcon, { backgroundColor: `${typeColors[w.type] || colors.primary}20` }]}>
                  <Text style={{ fontSize: 22 }}>
                    {w.type === 'strength' ? '🏋️' : w.type === 'cardio' ? '🏃' : w.type === 'hiit' ? '⚡' : w.type === 'flexibility' ? '🧘' : '♻️'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[{ color: colors.text, fontWeight: '700', fontSize: fontSize.md }]}>{w.title}</Text>
                  <Text style={[{ color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 }]}>
                    {w.duration_minutes}m • {w.difficulty} • {w.scheduled_date || '—'}
                  </Text>
                </View>
                <View style={[styles.tag, {
                  backgroundColor: w.completed ? `${colors.accentGreen}20` : `${typeColors[w.type]}20`,
                }]}>
                  <Text style={{ color: w.completed ? colors.accentGreen : typeColors[w.type], fontSize: fontSize.xs, fontWeight: '700' }}>
                    {w.completed ? '✓' : '→'}
                  </Text>
                </View>
              </View>
            </EVXCard>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const Section = ({ title, items, accentColor, colors, fontSize }: any) => (
  <View style={{ marginTop: 20 }}>
    <Text style={{ color: accentColor, fontWeight: '700', fontSize: fontSize.lg, marginBottom: 10 }}>{title}</Text>
    {items.map((ex: any, i: number) => (
      <View key={i} style={[styles.exCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: accentColor }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{ex.name}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          {ex.sets > 0 && <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{ex.sets} sets × {ex.reps}</Text>}
          {ex.rest_seconds > 0 && <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>Rest {ex.rest_seconds}s</Text>}
          {ex.duration_seconds && <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{ex.duration_seconds}s</Text>}
        </View>
        {ex.instructions && <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs, marginTop: 6 }}>{ex.instructions}</Text>}
        {ex.modifications && (
          <Text style={{ color: colors.warning, fontSize: fontSize.xs, marginTop: 4 }}>💡 {ex.modifications}</Text>
        )}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingBottom: 16 },
  title: { fontWeight: '800' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exCard: {
    padding: 14, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, marginBottom: 8,
  },
  completedBadge: { padding: 16, alignItems: 'center', marginTop: 16 },
});
