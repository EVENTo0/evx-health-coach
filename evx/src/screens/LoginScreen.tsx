import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { authService } from '../services/supabase';
import { EVXButton } from '../components/EVXButton';
import { EVXInput } from '../components/EVXInput';

interface Props {
  onAuthenticated: () => void;
}

type Mode = 'login' | 'signup' | 'forgot';

export const LoginScreen: React.FC<Props> = ({ onAuthenticated }) => {
  const { colors, spacing, fontSize, radius } = useTheme();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.includes('@')) e.email = 'Enter a valid email';
    if (mode !== 'forgot' && password.length < 8) e.password = 'Password must be 8+ characters';
    if (mode === 'signup' && !fullName.trim()) e.fullName = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await authService.signIn(email, password);
        onAuthenticated();
      } else if (mode === 'signup') {
        await authService.signUp(email, password, fullName);
        Alert.alert('Welcome to EVX!', 'Check your email to verify your account, then sign in.');
        setMode('login');
      } else {
        await authService.resetPassword(email);
        Alert.alert('Reset email sent', 'Check your inbox for password reset instructions.');
        setMode('login');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.flex, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={[styles.logoRing, { borderColor: `${colors.primary}40` }]}>
            <Text style={[styles.logoText, { color: colors.primary }]}>EVX</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text, fontSize: fontSize.xxxl }]}>
            {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSize.md }]}>
            {mode === 'signup'
              ? 'Start your health transformation'
              : mode === 'forgot'
                ? "We'll send you a reset link"
                : 'Your AI health coach is ready'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === 'signup' && (
            <EVXInput
              label="Full Name"
              placeholder="John Smith"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              autoCapitalize="words"
            />
          )}
          <EVXInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {mode !== 'forgot' && (
            <EVXInput
              label="Password"
              placeholder="8+ characters"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secure
            />
          )}

          {mode === 'login' && (
            <TouchableOpacity onPress={() => setMode('forgot')} style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: colors.primary, fontSize: fontSize.sm }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 8 }} />
          <EVXButton
            title={mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            onPress={handleSubmit}
            loading={loading}
          />
        </View>

        {/* Switch mode */}
        <View style={styles.switchRow}>
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' }}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingVertical: 60 },
  logoArea: { alignItems: 'center', marginBottom: 40, gap: 12 },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { fontSize: 26, fontWeight: '800', letterSpacing: 3 },
  appName: { fontWeight: '700' },
  subtitle: { textAlign: 'center' },
  form: {},
  forgotBtn: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 },
  forgotText: { fontWeight: '500' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
