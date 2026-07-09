import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { EVXCard } from './EVXCard';
import { EVXButton } from './EVXButton';
import { nutritionLogService, type NutritionLog, type DailyMacroTotals } from '../services/nutritionLog';

interface Props {
  userId: string;
  date: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWater: number;
  logs: NutritionLog[];
  onLogsChange: (logs: NutritionLog[]) => void;
}

export const MacroTracker: React.FC<Props> = ({
  userId, date,
  targetCalories, targetProtein, targetCarbs, targetFat, targetWater,
  logs, onLogsChange,
}) => {
  const { colors, fontSize, radius } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [water, setWater] = useState('');

  const totals: DailyMacroTotals = nutritionLogService.getTotals(logs);

  const handleAdd = async () => {
    if (!calories && !protein && !carbs && !fat && !water) {
      Alert.alert('Enter at least one value');
      return;
    }
    setSaving(true);
    try {
      const entry = await nutritionLogService.addEntry({
        user_id: userId,
        date,
        meal_name: mealName || undefined,
        calories_actual: parseFloat(calories) || 0,
        protein_actual_g: parseFloat(protein) || 0,
        carbs_actual_g: parseFloat(carbs) || 0,
        fat_actual_g: parseFloat(fat) || 0,
        water_actual_liters: parseFloat(water) || 0,
      });
      onLogsChange([...logs, entry]);
      setMealName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setWater('');
      setShowForm(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await nutritionLogService.deleteEntry(id);
      onLogsChange(logs.filter(l => l.id !== id));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const RingMeter = ({ label, actual, target, color }: { label: string; actual: number; target: number; color: string }) => {
    const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
    const over = actual > target && target > 0;
    return (
      <View style={{ alignItems: 'center', flex: 1 }}>
        <View style={[styles.ring, { borderColor: over ? '#FF6B6B' : color }]}>
          <Text style={{ color: over ? '#FF6B6B' : color, fontSize: 11, fontWeight: '800' }}>
            {Math.round(pct)}%
          </Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 4 }}>
          {Math.round(actual)}{label === 'Water' ? 'L' : 'g'}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{label}</Text>
      </View>
    );
  };

  const inp = (placeholder: string, value: string, setter: (v: string) => void) => (
    <TextInput
      value={value}
      onChangeText={setter}
      placeholder={placeholder}
      keyboardType="decimal-pad"
      style={[styles.inp, {
        color: colors.text,
        borderColor: colors.border,
        backgroundColor: colors.surface ?? colors.card,
        borderRadius: radius.sm,
        fontSize: fontSize.xs,
      }]}
      placeholderTextColor={colors.textSecondary}
    />
  );

  return (
    <EVXCard style={{ marginBottom: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>
          🍽️ Macro Tracker
        </Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: fontSize.lg }}>
            {Math.round(totals.calories)} <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>/ {targetCalories} kcal</Text>
          </Text>
        </View>
      </View>

      {/* Progress bar calories */}
      <View style={[styles.barBg, { backgroundColor: colors.border, marginBottom: 14 }]}>
        <View style={[
          styles.barFill,
          {
            width: `${Math.min((totals.calories / targetCalories) * 100, 100)}%`,
            backgroundColor: totals.calories > targetCalories ? '#FF6B6B' : colors.primary,
          },
        ]} />
      </View>

      {/* Macro rings */}
      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        <RingMeter label="Protein" actual={totals.protein_g} target={targetProtein} color={colors.primary} />
        <RingMeter label="Carbs" actual={totals.carbs_g} target={targetCarbs} color="#A3FF6E" />
        <RingMeter label="Fat" actual={totals.fat_g} target={targetFat} color="#FF9F3F" />
        <RingMeter label="Water" actual={totals.water_liters} target={targetWater} color="#4DB6FF" />
      </View>

      {/* Logged meals */}
      {logs.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          {logs.map((l) => (
            <View key={l.id} style={[styles.logRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '600' }}>
                  {l.meal_name || 'Entry'} — {Math.round(l.calories_actual)} kcal
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
                  P:{Math.round(l.protein_actual_g)}g  C:{Math.round(l.carbs_actual_g)}g  F:{Math.round(l.fat_actual_g)}g
                  {l.water_actual_liters > 0 ? `  💧${l.water_actual_liters}L` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(l.id)}>
                <Text style={{ color: '#FF6B6B', fontSize: 16, paddingLeft: 8 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add form */}
      {showForm ? (
        <View>
          {inp('Meal name (optional)', mealName, setMealName)}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {inp('kcal', calories, setCalories)}
            {inp('protein g', protein, setProtein)}
            {inp('carbs g', carbs, setCarbs)}
            {inp('fat g', fat, setFat)}
            {inp('water L', water, setWater)}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <EVXButton title="Add" onPress={handleAdd} loading={saving} size="sm" fullWidth={false} style={{ flex: 1 }} />
            <EVXButton title="Cancel" onPress={() => setShowForm(false)} variant="ghost" size="sm" fullWidth={false} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={[styles.addBtn, { borderColor: colors.border, borderRadius: radius.md }]}
        >
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.sm }}>+ Log a meal</Text>
        </TouchableOpacity>
      )}
    </EVXCard>
  );
};

const styles = StyleSheet.create({
  ring: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1 },
  inp: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 6 },
  addBtn: { borderWidth: 1.5, borderStyle: 'dashed', paddingVertical: 10, alignItems: 'center' },
});
