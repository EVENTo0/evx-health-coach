import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { EVXCard } from './EVXCard';
import { EVXButton } from './EVXButton';
import { COMMON_SYMPTOMS, type SymptomKey } from '../services/symptoms';

const LABELS: Record<SymptomKey, string> = {
  fatigue: 'Fatigue',
  muscle_soreness: 'Soreness',
  headache: 'Headache',
  nausea: 'Nausea',
  joint_pain: 'Joint pain',
  poor_sleep: 'Poor sleep',
  stress: 'Stress',
  bloating: 'Bloating',
  low_appetite: 'Low appetite',
  none: "I feel great",
};

interface Props {
  onSubmit: (symptoms: string[], energyLevel: number) => Promise<void>;
  alreadyLoggedToday?: boolean;
}

export const SymptomCheckIn: React.FC<Props> = ({ onSubmit, alreadyLoggedToday }) => {
  const { colors, radius, fontSize } = useTheme();
  const [selected, setSelected] = useState<string[]>([]);
  const [energy, setEnergy] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!alreadyLoggedToday);

  const toggle = (key: string) => {
    if (key === 'none') {
      setSelected(['none']);
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((s) => s !== 'none');
      return withoutNone.includes(key)
        ? withoutNone.filter((s) => s !== key)
        : [...withoutNone, key];
    });
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await onSubmit(selected, energy);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <EVXCard style={styles.card}>
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
          ✓ Check-in logged for today — your AI plans will adapt if needed.
        </Text>
      </EVXCard>
    );
  }

  return (
    <EVXCard style={styles.card}>
      <Text style={[styles.title, { color: colors.text, fontSize: fontSize.md }]}>
        How are you feeling today?
      </Text>
      <View style={styles.chipsRow}>
        {COMMON_SYMPTOMS.map((key) => {
          const active = selected.includes(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => toggle(key)}
              style={[
                styles.chip,
                {
                  borderRadius: radius.md,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? `${colors.primary}20` : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.primary : colors.textSecondary,
                  fontSize: fontSize.xs,
                  fontWeight: active ? '700' : '400',
                }}
              >
                {LABELS[key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
        Energy level: {energy}/5
      </Text>
      <View style={styles.energyRow}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <TouchableOpacity
            key={lvl}
            onPress={() => setEnergy(lvl)}
            style={[
              styles.energyDot,
              {
                borderRadius: radius.md,
                backgroundColor: lvl <= energy ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <EVXButton
        title="Log check-in"
        onPress={handleSubmit}
        loading={saving}
        disabled={selected.length === 0}
        size="sm"
        style={{ marginTop: 12 }}
      />
    </EVXCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  title: { fontWeight: '700', marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5 },
  subLabel: { marginTop: 14, marginBottom: 6 },
  energyRow: { flexDirection: 'row', gap: 6 },
  energyDot: { width: 32, height: 8 },
});
