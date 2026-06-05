import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store';
import { nutritionService } from '../services/supabase';
import { generateMealPlan } from '../services/ai';
import { EVXCard } from '../components/EVXCard';
import { EVXButton } from '../components/EVXButton';
import { EVXLoader } from '../components/EVXLoader';
import type { NutritionPlan, Meal } from '../types';

interface Props { navigation: any; }

export const NutritionScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, healthProfile } = useAppStore();
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [todayPlan, setTodayPlan] = useState<NutritionPlan | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      Promise.all([
        nutritionService.list(user.id),
        nutritionService.getByDate(user.id, today),
      ]).then(([all, today]) => {
        setPlans(all);
        setTodayPlan(today);
      }).finally(() => setLoading(false));
    }
  }, []);

  const handleGenerate = async () => {
    if (!healthProfile) {
      Alert.alert('Profile needed', 'Complete onboarding first.');
      return;
    }
    setGenerating(true);
    try {
      const aiPlan = await generateMealPlan(healthProfile);
      const saved = await nutritionService.create({
        user_id: user!.id,
        date: today,
        total_calories: aiPlan.total_calories || 2000,
        total_protein_g: aiPlan.total_protein_g || 150,
        total_carbs_g: aiPlan.total_carbs_g || 200,
        total_fat_g: aiPlan.total_fat_g || 60,
        water_goal_liters: aiPlan.water_goal_liters || 3,
        breakfast: aiPlan.breakfast!,
        lunch: aiPlan.lunch!,
        dinner: aiPlan.dinner!,
        snacks: aiPlan.snacks || [],
        protein_guidance: aiPlan.protein_guidance || '',
        hydration_guidance: aiPlan.hydration_guidance || '',
        notes: aiPlan.notes || '',
      });
      setTodayPlan(saved);
      setPlans([saved, ...plans]);
    } catch (err: any) {
      Alert.alert('Generation failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const MacroBar = ({ label, value, total, color }: any) => {
    const pct = Math.min((value / total) * 100, 100);
    return (
      <View style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{label}</Text>
          <Text style={{ color: color, fontSize: fontSize.xs, fontWeight: '700' }}>{value}g</Text>
        </View>
        <View style={[styles.barBg, { backgroundColor: colors.border }]}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  const MealCard = ({ meal, emoji, accentColor }: { meal: Meal; emoji: string; accentColor: string }) => (
    <EVXCard style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 22, marginRight: 8 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{meal.name}</Text>
          <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs }}>{meal.time}</Text>
        </View>
        <View style={[styles.calBadge, { backgroundColor: `${accentColor}15` }]}>
          <Text style={{ color: accentColor, fontSize: fontSize.xs, fontWeight: '700' }}>{meal.calories} kcal</Text>
        </View>
      </View>
      {meal.foods.map((food, i) => (
        <Text key={i} style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginLeft: 30 }}>
          • {food}
        </Text>
      ))}
      {meal.notes && (
        <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs, marginTop: 6, marginLeft: 30 }}>
          💡 {meal.notes}
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, marginLeft: 30 }}>
        <Text style={{ color: colors.primary, fontSize: fontSize.xs }}>P: {meal.protein_g}g</Text>
        <Text style={{ color: colors.accentGreen, fontSize: fontSize.xs }}>C: {meal.carbs_g}g</Text>
        <Text style={{ color: colors.accent, fontSize: fontSize.xs }}>F: {meal.fat_g}g</Text>
      </View>
    </EVXCard>
  );

  if (loading) return <EVXLoader fullScreen message="Loading nutrition plans..." />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xxxl }]}>EVX Nutrition 🥗</Text>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm }]}>
          Personalized AI meal plans
        </Text>
      </View>

      <EVXButton
        title={generating ? 'Generating Meal Plan...' : "✦ Generate Today's Meal Plan"}
        onPress={handleGenerate}
        loading={generating}
        style={{ marginTop: 4, marginBottom: 24 }}
      />

      {todayPlan ? (
        <>
          {/* Macro summary */}
          <EVXCard glowColor={colors.accentGreen} style={{ marginBottom: 16 }}>
            <Text style={[{ color: colors.text, fontWeight: '800', fontSize: fontSize.xl, marginBottom: 2 }]}>
              Today's Nutrition
            </Text>
            <Text style={[{ color: colors.textTertiary, fontSize: fontSize.xs, marginBottom: 16 }]}>{today}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
              {[
                { label: 'Calories', value: todayPlan.total_calories, unit: 'kcal', color: colors.warning },
                { label: 'Water', value: `${todayPlan.water_goal_liters}L`, unit: 'goal', color: colors.info },
              ].map(m => (
                <View key={m.label} style={{ alignItems: 'center' }}>
                  <Text style={{ color: m.color, fontSize: fontSize.xxxl, fontWeight: '800' }}>{m.value}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>{m.label}</Text>
                </View>
              ))}
            </View>

            <MacroBar label="Protein" value={todayPlan.total_protein_g} total={todayPlan.total_protein_g + todayPlan.total_carbs_g + todayPlan.total_fat_g} color={colors.primary} />
            <MacroBar label="Carbs" value={todayPlan.total_carbs_g} total={todayPlan.total_protein_g + todayPlan.total_carbs_g + todayPlan.total_fat_g} color={colors.accentGreen} />
            <MacroBar label="Fat" value={todayPlan.total_fat_g} total={todayPlan.total_protein_g + todayPlan.total_carbs_g + todayPlan.total_fat_g} color={colors.accent} />
          </EVXCard>

          {/* Meals */}
          <MealCard meal={todayPlan.breakfast} emoji="🌅" accentColor={colors.warning} />
          <MealCard meal={todayPlan.lunch} emoji="☀️" accentColor={colors.accentGreen} />
          <MealCard meal={todayPlan.dinner} emoji="🌙" accentColor={colors.primary} />
          {todayPlan.snacks?.map((snack, i) => (
            <MealCard key={i} meal={snack} emoji="🍎" accentColor={colors.accent} />
          ))}

          {/* Guidance */}
          {todayPlan.protein_guidance && (
            <EVXCard style={{ marginTop: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.sm, marginBottom: 4 }}>
                💪 Protein Guidance
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>{todayPlan.protein_guidance}</Text>
            </EVXCard>
          )}
          {todayPlan.hydration_guidance && (
            <EVXCard style={{ marginTop: 8 }}>
              <Text style={{ color: colors.info, fontWeight: '700', fontSize: fontSize.sm, marginBottom: 4 }}>
                💧 Hydration Guidance
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>{todayPlan.hydration_guidance}</Text>
            </EVXCard>
          )}
        </>
      ) : (
        <EVXCard style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🥗</Text>
          <Text style={[{ color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: 8 }]}>
            No meal plan for today
          </Text>
          <Text style={[{ color: colors.textSecondary, textAlign: 'center', fontSize: fontSize.sm }]}>
            Generate a personalized meal plan based on your goals, preferences, and restrictions.
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
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  calBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
