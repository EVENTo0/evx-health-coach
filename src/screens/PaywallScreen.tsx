import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { PLANS, PREMIUM_FEATURES, startFreeTrial } from '../services/subscription';
import { useAppStore } from '../store';

const { width } = Dimensions.get('window');

interface PaywallScreenProps {
  onSuccess?: () => void;
  onDismiss?: () => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ onSuccess, onDismiss }) => {
  const { colors, isDark } = useTheme();
  const { setSubscription } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const result = await startFreeTrial();
      if (result.success) {
        setSubscription({ isPremium: true, plan: 'premium_monthly' });
        Alert.alert(
          '🎉 Trial Started!',
          'Your 7-day free trial is active. Enjoy all premium features!',
          [{ text: 'Let\'s Go!', onPress: onSuccess }]
        );
      } else {
        Alert.alert('Error', result.error || 'Could not start trial. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    // In production: integrate react-native-purchases (RevenueCat) here
    // For now, show trial option
    Alert.alert(
      'Subscribe to EVX Premium',
      `You selected the ${PLANS[selectedPlan].label} plan at ${PLANS[selectedPlan].price}/${PLANS[selectedPlan].period}.\n\nGoogle Play billing will be set up for launch. Start your 7-day free trial now!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Free Trial', onPress: handleStartTrial },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* Header Gradient */}
        <LinearGradient
          colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2']}
          style={styles.header}
        >
          {onDismiss && (
            <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerEmoji}>⚡</Text>
          <Text style={styles.headerTitle}>EVX Premium</Text>
          <Text style={styles.headerSubtitle}>
            Your AI-powered health & fitness coach
          </Text>
          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeText}>7-DAY FREE TRIAL</Text>
          </View>
        </LinearGradient>

        {/* Features List */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Everything included
          </Text>
          {PREMIUM_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.description}</Text>
              </View>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ))}
        </View>

        {/* Plan Selector */}
        <View style={styles.planSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose your plan</Text>
          <View style={styles.planRow}>
            {(['annual', 'monthly'] as const).map((key) => {
              const plan = PLANS[key];
              const isSelected = selectedPlan === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.planCard,
                    { borderColor: isSelected ? '#667eea' : colors.border },
                    isSelected && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan(key)}
                >
                  {key === 'annual' && (
                    <View style={styles.savingBadge}>
                      <Text style={styles.savingText}>SAVE 50%</Text>
                    </View>
                  )}
                  <Text style={[styles.planLabel, { color: isSelected ? '#667eea' : colors.text }]}>
                    {plan.label}
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.text }]}>{plan.price}</Text>
                  <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>per {plan.period}</Text>
                  <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{plan.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  Start Free Trial → {PLANS[selectedPlan].price}/{PLANS[selectedPlan].period}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.trialBtn, { borderColor: colors.border }]}
            onPress={handleStartTrial}
            disabled={loading}
          >
            <Text style={[styles.trialBtnText, { color: colors.textSecondary }]}>
              Start 7-day free trial (no payment needed)
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            Cancel anytime. No charges during trial.{'\n'}
            Subscription auto-renews unless cancelled 24h before period ends.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 20,
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerEmoji: { fontSize: 48, marginBottom: 12 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 20 },
  trialBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20,
  },
  trialBadgeText: { color: '#1a1a1a', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  section: { margin: 16, borderRadius: 16, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureIcon: { fontSize: 24, width: 36 },
  featureText: { flex: 1, marginLeft: 8 },
  featureTitle: { fontSize: 15, fontWeight: '600' },
  featureDesc: { fontSize: 13, marginTop: 2 },
  checkmark: { color: '#4CAF50', fontSize: 18, fontWeight: '800' },
  planSection: { paddingHorizontal: 16, marginBottom: 8 },
  planRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  planCard: {
    flex: 1, borderWidth: 2, borderRadius: 16,
    padding: 16, alignItems: 'center', position: 'relative',
    backgroundColor: 'transparent',
  },
  planCardSelected: { backgroundColor: 'rgba(102,126,234,0.08)' },
  savingBadge: {
    position: 'absolute', top: -10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10,
  },
  savingText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  planPrice: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  planPeriod: { fontSize: 12, marginBottom: 4 },
  planDesc: { fontSize: 11, textAlign: 'center' },
  ctaSection: { paddingHorizontal: 16, paddingBottom: 40, marginTop: 8 },
  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  primaryBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
  trialBtn: {
    borderWidth: 1, borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', marginBottom: 16,
  },
  trialBtnText: { fontSize: 14, fontWeight: '600' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 18 },
});
