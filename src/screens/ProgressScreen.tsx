import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store';
import { progressService } from '../services/supabase';
import { EVXCard } from '../components/EVXCard';
import { EVXButton } from '../components/EVXButton';
import { EVXLoader } from '../components/EVXLoader';
import type { ProgressLog } from '../types';
import { generateProgressInsights, type ProgressInsight } from '../services/ai';

interface Props { navigation?: any; }

export const ProgressScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, healthProfile } = useAppStore();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [water, setWater] = useState('');
  const [sleep, setSleep] = useState('');
  const [energy, setEnergy] = useState('');
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');
  const [workoutDone, setWorkoutDone] = useState(false);
  const [insight, setInsight] = useState<ProgressInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      progressService.list(user.id).then(setLogs).finally(() => setLoading(false));
    }
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const log = await progressService.upsert({
        user_id: user.id,
        date: today,
        weight_kg: weight ? parseFloat(weight) : undefined,
        waist_cm: waist ? parseFloat(waist) : undefined,
        water_intake_liters: water ? parseFloat(water) : undefined,
        sleep_hours: sleep ? parseFloat(sleep) : undefined,
        energy_level: energy ? parseInt(energy) : undefined,
        mood: mood ? parseInt(mood) : undefined,
        workout_completed: workoutDone,
        notes: notes || undefined,
      });
      setLogs([log, ...logs.filter(l => l.date !== today)]);
      setShowForm(false);
      Alert.alert('Saved!', 'Progress logged successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!healthProfile || !logs.length) return;
    setLoadingInsight(true);
    try {
      const result = await generateProgressInsights(healthProfile, logs);
      setInsight(result);
    } catch (err: any) {
      Alert.alert('Could not generate insights', err.message);
    } finally {
      setLoadingInsight(false);
    }
  };

  const latestLog = logs[logs.length - 1];
  const firstLog = logs[0];
  const weightChange = latestLog && firstLog
    ? ((latestLog.weight_kg || 0) - (firstLog.weight_kg || 0)).toFixed(1)
    : null;

  if (loading) return <EVXLoader fullScreen message="Loading progress..." />;

  const MiniChart = ({ data, color, label }: { data: number[]; color: string; label: string }) => {
    const max = Math.max(...data, 1);
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 6 }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40 }}>
          {data.slice(-14).map((v, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: Math.max((v / max) * 40, 2),
                backgroundColor: i === data.length - 1 ? color : `${color}50`,
                borderRadius: 2,
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  const RatingButton = ({ value, current, onPress }: any) => (
    <TouchableOpacity
      onPress={() => onPress(String(value))}
      style={[
        styles.ratingBtn,
        {
          backgroundColor: current === String(value) ? colors.primary : colors.card,
          borderColor: current === String(value) ? colors.primary : colors.border,
          borderRadius: radius.sm,
        },
      ]}
    >
      <Text style={{ color: current === String(value) ? '#000' : colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' }}>
        {value}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xxxl }]}>Progress 📈</Text>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm }]}>
          Track your transformation
        </Text>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <EVXButton
          title={showForm ? '← Cancel' : '+ Log Today'}
          onPress={() => setShowForm(!showForm)}
          variant={showForm ? 'ghost' : 'primary'}
          fullWidth={false}
          style={{ flex: 1 }}
        />
        {logs.length > 0 && (
          <EVXButton
            title={loadingInsight ? 'Thinking…' : '🧠 AI Insights'}
            onPress={handleGenerateInsights}
            variant="secondary"
            loading={loadingInsight}
            disabled={loadingInsight}
            fullWidth={false}
            style={{ flex: 1 }}
          />
        )}
      </View>

      {/* AI Insights Card */}
      {insight && (
        <EVXCard style={{ marginBottom: 20 }} glowColor="#7B61FF">
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.lg, marginBottom: 4 }}>
            🧠 {insight.headline}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 14, lineHeight: 20 }}>
            {insight.summary}
          </Text>

          {insight.trends.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              {insight.trends.map((t, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                  <Text>{t.direction === 'up' ? '📈' : t.direction === 'down' ? '📉' : '➡️'}</Text>
                  <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.sm }}>{t.observation}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Recommendations
          </Text>
          {insight.recommendations.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
              <Text style={{ color: '#A3FF6E', fontWeight: '700' }}>{i + 1}.</Text>
              <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.sm }}>{r}</Text>
            </View>
          ))}

          <View style={{ marginTop: 12, padding: 12, backgroundColor: '#7B61FF15', borderRadius: 12 }}>
            <Text style={{ color: '#7B61FF', fontSize: fontSize.sm, fontStyle: 'italic', lineHeight: 20 }}>
              "{insight.motivation}"
            </Text>
          </View>
        </EVXCard>
      )}

      {/* Form */}
      {showForm && (
        <EVXCard style={{ marginBottom: 20 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.lg, marginBottom: 16 }}>
            Log Today — {today}
          </Text>

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 4 }}>Weight (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder={healthProfile?.weight_kg?.toString() || '—'}
                keyboardType="decimal-pad"
                style={[styles.miniInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 4 }}>Waist (cm)</Text>
              <TextInput
                value={waist}
                onChangeText={setWaist}
                placeholder="—"
                keyboardType="decimal-pad"
                style={[styles.miniInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 4 }}>Water (liters)</Text>
              <TextInput
                value={water}
                onChangeText={setWater}
                placeholder="e.g. 2.5"
                keyboardType="decimal-pad"
                style={[styles.miniInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 4 }}>Sleep (hrs)</Text>
              <TextInput
                value={sleep}
                onChangeText={setSleep}
                placeholder="e.g. 7.5"
                keyboardType="decimal-pad"
                style={[styles.miniInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 6 }}>Energy Level (1–10)</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
              <RatingButton key={v} value={v} current={energy} onPress={setEnergy} />
            ))}
          </View>

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 6 }}>Mood (1–10)</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
              <RatingButton key={v} value={v} current={mood} onPress={setMood} />
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setWorkoutDone(!workoutDone)}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}
          >
            <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: workoutDone ? colors.primary : 'transparent' }]}>
              {workoutDone && <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>✓</Text>}
            </View>
            <Text style={{ color: colors.text, fontSize: fontSize.sm }}>Workout completed today</Text>
          </TouchableOpacity>

          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 4 }}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="How did today go?"
            multiline
            numberOfLines={3}
            style={[styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholderTextColor={colors.textMuted}
          />

          <EVXButton title="Save Progress" onPress={handleSave} loading={saving} style={{ marginTop: 8 }} />
        </EVXCard>
      )}

      {/* Summary stats */}
      {logs.length > 0 && (
        <EVXCard style={{ marginBottom: 16 }} glowColor={colors.primary}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.lg, marginBottom: 12 }}>
            Overview ({logs.length} entries)
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[
              { label: 'Current Weight', value: `${logs[logs.length - 1]?.weight_kg || '—'}kg`, color: colors.primary },
              { label: 'Change', value: weightChange ? `${parseFloat(weightChange) > 0 ? '+' : ''}${weightChange}kg` : '—', color: parseFloat(weightChange || '0') < 0 ? colors.accentGreen : colors.accent },
              { label: 'Streak', value: `${logs.filter(l => l.workout_completed).length} 🔥`, color: colors.warning },
            ].map(s => (
              <View key={s.label} style={{ alignItems: 'center' }}>
                <Text style={{ color: s.color, fontWeight: '800', fontSize: fontSize.xl }}>{s.value}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </EVXCard>
      )}

      {/* Charts */}
      {logs.length > 1 && (
        <EVXCard style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.md, marginBottom: 16 }}>
            Trends (Last 14 Days)
          </Text>
          <MiniChart
            data={logs.map(l => l.weight_kg || 0).filter(Boolean)}
            color={colors.primary}
            label="Weight (kg)"
          />
          <MiniChart
            data={logs.map(l => l.water_intake_liters || 0)}
            color={colors.info}
            label="Water Intake (L)"
          />
          <MiniChart
            data={logs.map(l => l.sleep_hours || 0)}
            color={colors.accentPurple}
            label="Sleep (hours)"
          />
          <MiniChart
            data={logs.map(l => l.energy_level || 0)}
            color={colors.warning}
            label="Energy Level"
          />
        </EVXCard>
      )}

      {/* Log history */}
      {logs.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LOG HISTORY</Text>
          {[...logs].reverse().map(log => (
            <EVXCard key={log.id} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.sm }}>{log.date}</Text>
                {log.workout_completed && (
                  <Text style={{ color: colors.accentGreen, fontSize: fontSize.xs, fontWeight: '700' }}>✓ Workout</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
                {log.weight_kg && <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{log.weight_kg}kg</Text>}
                {log.water_intake_liters && <Text style={{ color: colors.info, fontSize: fontSize.xs }}>💧 {log.water_intake_liters}L</Text>}
                {log.sleep_hours && <Text style={{ color: colors.accentPurple, fontSize: fontSize.xs }}>😴 {log.sleep_hours}h</Text>}
                {log.energy_level && <Text style={{ color: colors.warning, fontSize: fontSize.xs }}>⚡ {log.energy_level}/10</Text>}
              </View>
              {log.notes && <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs, marginTop: 4 }}>{log.notes}</Text>}
            </EVXCard>
          ))}
        </>
      )}

      {logs.length === 0 && !showForm && (
        <EVXCard style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📈</Text>
          <Text style={[{ color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: 8 }]}>
            Start tracking
          </Text>
          <Text style={[{ color: colors.textSecondary, textAlign: 'center', fontSize: fontSize.sm }]}>
            Log your daily weight, water, sleep, and energy to see your transformation over time.
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
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  miniInput: {
    height: 44, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, fontSize: 15,
  },
  notesInput: {
    borderWidth: 1, borderRadius: 10,
    padding: 12, fontSize: 14, height: 80,
    textAlignVertical: 'top',
  },
  ratingBtn: { flex: 1, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
