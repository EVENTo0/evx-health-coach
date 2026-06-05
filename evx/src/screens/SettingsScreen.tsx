import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store';
import { authService } from '../services/supabase';
import { EVXCard } from '../components/EVXCard';

interface Props { navigation: any; }

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const { user, healthProfile, toggleTheme, theme } = useAppStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => authService.signOut() },
    ]);
  };

  const bmi = healthProfile
    ? (healthProfile.weight_kg / Math.pow(healthProfile.height_cm / 100, 2)).toFixed(1)
    : '—';

  const Row = ({ label, value, onPress, danger }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <Text style={{ color: danger ? colors.error : colors.text, fontSize: fontSize.md }}>{label}</Text>
      {value !== undefined && (
        <Text style={{ color: colors.textTertiary, fontSize: fontSize.sm }}>{value}</Text>
      )}
      {onPress && !value && (
        <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg }}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xxxl }]}>Settings ⚙️</Text>
      </View>

      {/* Profile Card */}
      <EVXCard style={{ marginBottom: 20, alignItems: 'center', paddingVertical: 24 }} glowColor={colors.primary}>
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
          <Text style={{ color: colors.primary, fontSize: fontSize.xxxl, fontWeight: '800' }}>
            {user?.full_name?.[0] || 'U'}
          </Text>
        </View>
        <Text style={[{ color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginTop: 12 }]}>
          {user?.full_name || 'EVX User'}
        </Text>
        <Text style={[{ color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 }]}>
          {user?.email}
        </Text>
        {healthProfile && (
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: fontSize.lg }}>{healthProfile.weight_kg}kg</Text>
              <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs }}>Weight</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.accentGreen, fontWeight: '800', fontSize: fontSize.lg }}>{healthProfile.height_cm}cm</Text>
              <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs }}>Height</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.warning, fontWeight: '800', fontSize: fontSize.lg }}>{bmi}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs }}>BMI</Text>
            </View>
          </View>
        )}
      </EVXCard>

      {/* Health Profile */}
      {healthProfile && (
        <EVXCard style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR PROFILE</Text>
          <Row label="Goal" value={healthProfile.primary_goal?.replace('_', ' ')} />
          <Row label="Fitness Level" value={healthProfile.fitness_level} />
          <Row label="Activity Level" value={healthProfile.activity_level?.replace('_', ' ')} />
          <Row label="Age" value={`${healthProfile.age} years`} />
          <Row label="Training Days" value={`${healthProfile.training_days?.length || 0} days/week`} />
          <Row label="Sleep Target" value={`${healthProfile.sleep_hours_target} hours`} />
        </EVXCard>
      )}

      {/* Preferences */}
      <EVXCard style={{ marginBottom: 16 }}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PREFERENCES</Text>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={{ color: colors.text, fontSize: fontSize.md }}>Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: `${colors.primary}60` }}
            thumbColor={theme === 'dark' ? colors.primary : colors.textTertiary}
          />
        </View>
        <Row label="Language" value="English" />
        <Row label="Units" value="Metric (kg, cm)" />
      </EVXCard>

      {/* About */}
      <EVXCard style={{ marginBottom: 16 }}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ABOUT EVX</Text>
        <Row label="Version" value="1.0.0" />
        <Row label="Privacy Policy" onPress={() => {}} />
        <Row label="Terms of Service" onPress={() => {}} />
        <Row label="Support" onPress={() => {}} />
      </EVXCard>

      {/* Sign Out */}
      <EVXCard style={{ marginBottom: 16 }}>
        <Row label="Sign Out" onPress={handleSignOut} danger />
      </EVXCard>

      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', marginTop: 8 }}>
        EVX – AI Health, Fitness & Nutrition Coach{'\n'}
        This app provides educational content only. Not medical advice.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { paddingTop: 56, paddingBottom: 16 },
  title: { fontWeight: '800' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
});
