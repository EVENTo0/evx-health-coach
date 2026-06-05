import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { healthProfileService } from '../services/supabase';
import { useAppStore } from '../store';
import { EVXButton } from '../components/EVXButton';
import { EVXInput } from '../components/EVXInput';
import type { Goal, ActivityLevel, FitnessLevel, EquipmentType, Gender } from '../types';

interface Props { onComplete: () => void; }

const STEPS = 5;

const GOALS: { value: Goal; label: string; emoji: string }[] = [
  { value: 'fat_loss', label: 'Fat Loss', emoji: '🔥' },
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪' },
  { value: 'general_health', label: 'General Health', emoji: '❤️' },
  { value: 'endurance', label: 'Endurance', emoji: '🏃' },
  { value: 'flexibility', label: 'Flexibility', emoji: '🧘' },
  { value: 'maintenance', label: 'Maintenance', emoji: '⚖️' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, little movement' },
  { value: 'lightly_active', label: 'Lightly Active', desc: '1–3 days/week exercise' },
  { value: 'moderately_active', label: 'Moderately Active', desc: '3–5 days/week' },
  { value: 'very_active', label: 'Very Active', desc: '6–7 days/week' },
  { value: 'extremely_active', label: 'Extremely Active', desc: 'Physical job + training' },
];

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, setHealthProfile } = useAppStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState<Goal>('fat_loss');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('intermediate');
  const [healthConditions, setHealthConditions] = useState('');
  const [foodPreferences, setFoodPreferences] = useState('');
  const [foodRestrictions, setFoodRestrictions] = useState('');
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('16:00');
  const [trainingStart, setTrainingStart] = useState('17:00');
  const [trainingEnd, setTrainingEnd] = useState('19:00');
  const [sleepHours, setSleepHours] = useState('8');
  const [equipment, setEquipment] = useState<EquipmentType>('gym');

  const progress = (step / STEPS) * 100;

  const handleNext = () => {
    if (step < STEPS) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await healthProfileService.upsert({
        user_id: user.id,
        age: parseInt(age),
        gender,
        height_cm: parseFloat(heightCm),
        weight_kg: parseFloat(weightKg),
        primary_goal: primaryGoal,
        secondary_goals: [],
        activity_level: activityLevel,
        fitness_level: fitnessLevel,
        health_conditions: healthConditions.split(',').map(s => s.trim()).filter(Boolean),
        food_preferences: foodPreferences.split(',').map(s => s.trim()).filter(Boolean),
        food_restrictions: foodRestrictions.split(',').map(s => s.trim()).filter(Boolean),
        sleep_hours_target: parseInt(sleepHours),
        work_start_time: workStart,
        work_end_time: workEnd,
        training_start_time: trainingStart,
        training_end_time: trainingEnd,
        training_days: [1, 2, 3, 4, 5],
        equipment,
        onboarding_completed: true,
      });
      setHealthProfile(profile);
      onComplete();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const SelectChip = ({ label, selected, onPress, emoji }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderRadius: radius.md,
        },
      ]}
    >
      {emoji && <Text style={{ marginRight: 4 }}>{emoji}</Text>}
      <Text style={{ color: selected ? '#000' : colors.text, fontWeight: '600', fontSize: fontSize.sm }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontSize: fontSize.xxl }]}>
              Let's get to know you 👋
            </Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              This helps us personalize everything for you.
            </Text>
            <EVXInput label="Age" placeholder="e.g. 32" value={age} onChangeText={setAge} keyboardType="numeric" />
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 8 }]}>Gender</Text>
            <View style={styles.row}>
              {(['male', 'female', 'other'] as Gender[]).map(g => (
                <SelectChip key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} selected={gender === g} onPress={() => setGender(g)} />
              ))}
            </View>
            <EVXInput label="Height (cm)" placeholder="e.g. 172" value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" />
            <EVXInput label="Weight (kg)" placeholder="e.g. 96" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontSize: fontSize.xxl }]}>
              What's your goal? 🎯
            </Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Choose your primary focus.
            </Text>
            <View style={styles.grid}>
              {GOALS.map(g => (
                <SelectChip
                  key={g.value}
                  label={g.label}
                  emoji={g.emoji}
                  selected={primaryGoal === g.value}
                  onPress={() => setPrimaryGoal(g.value)}
                />
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontSize: fontSize.xxl }]}>
              Activity & Fitness Level 🏋️
            </Text>
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 12 }]}>Activity Level</Text>
            {ACTIVITY_LEVELS.map(a => (
              <TouchableOpacity
                key={a.value}
                onPress={() => setActivityLevel(a.value)}
                style={[
                  styles.activityCard,
                  {
                    backgroundColor: activityLevel === a.value ? `${colors.primary}15` : colors.card,
                    borderColor: activityLevel === a.value ? colors.primary : colors.border,
                    borderRadius: radius.lg,
                    marginBottom: 8,
                  },
                ]}
              >
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: fontSize.sm }}>{a.label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{a.desc}</Text>
              </TouchableOpacity>
            ))}
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 12, marginBottom: 8 }]}>Fitness Level</Text>
            <View style={styles.row}>
              {(['beginner', 'intermediate', 'advanced'] as FitnessLevel[]).map(f => (
                <SelectChip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} selected={fitnessLevel === f} onPress={() => setFitnessLevel(f)} />
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontSize: fontSize.xxl }]}>
              Your Schedule ⏰
            </Text>
            <EVXInput label="Work Start Time" placeholder="08:00" value={workStart} onChangeText={setWorkStart} />
            <EVXInput label="Work End Time" placeholder="16:00" value={workEnd} onChangeText={setWorkEnd} />
            <EVXInput label="Training Start Time" placeholder="17:00" value={trainingStart} onChangeText={setTrainingStart} />
            <EVXInput label="Training End Time" placeholder="19:00" value={trainingEnd} onChangeText={setTrainingEnd} />
            <EVXInput label="Sleep Target (hours)" placeholder="8" value={sleepHours} onChangeText={setSleepHours} keyboardType="numeric" />
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontSize: fontSize.xxl }]}>
              Health & Nutrition 🥗
            </Text>
            <EVXInput
              label="Health Conditions (optional)"
              placeholder="e.g. Lower back pain, diabetes"
              value={healthConditions}
              onChangeText={setHealthConditions}
              hint="Separate with commas"
            />
            <EVXInput
              label="Food Preferences"
              placeholder="e.g. Mediterranean, high protein"
              value={foodPreferences}
              onChangeText={setFoodPreferences}
              hint="Separate with commas"
            />
            <EVXInput
              label="Food Restrictions"
              placeholder="e.g. Lactose intolerant, no pork"
              value={foodRestrictions}
              onChangeText={setFoodRestrictions}
              hint="Separate with commas"
            />
            <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 8 }]}>Equipment Available</Text>
            <View style={styles.row}>
              {(['none', 'minimal', 'home_gym', 'gym'] as EquipmentType[]).map(e => (
                <SelectChip key={e} label={e.replace('_', ' ')} selected={equipment === e} onPress={() => setEquipment(e)} />
              ))}
            </View>
          </View>
        );
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.flex, { backgroundColor: colors.bg }]}
    >
      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.stepCounter, { color: colors.textTertiary, fontSize: fontSize.xs }]}>
        Step {step} of {STEPS}
      </Text>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: spacing.lg, backgroundColor: colors.bg }]}>
        <EVXButton
          title={step === STEPS ? '🚀 Start My Journey' : 'Continue →'}
          onPress={handleNext}
          loading={loading && step === STEPS}
        />
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={{ marginTop: 12, alignSelf: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressBar: { height: 3, width: '100%' },
  progressFill: { height: 3 },
  stepCounter: { textAlign: 'center', marginTop: 8, marginBottom: 4 },
  scrollContent: { paddingVertical: 24 },
  stepContent: {},
  stepTitle: { fontWeight: '700', marginBottom: 8 },
  stepDesc: { marginBottom: 24 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center' },
  activityCard: { padding: 14, borderWidth: 1.5 },
  footer: { paddingBottom: 32, paddingTop: 12 },
});
