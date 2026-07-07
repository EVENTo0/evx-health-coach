import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../services/supabase';
import { EVXButton } from '../components/EVXButton';
import { EVXInput } from '../components/EVXInput';

interface Props {
  onDone: () => void;
}

// Shown when the user taps the "reset password" link from their email.
// By the time this screen renders, App.tsx has already exchanged the
// recovery link for a valid Supabase session.
export const ResetPasswordScreen: React.FC<Props> = ({ onDone }) => {
  const { colors, spacing, fontSize } = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (password.length < 8) {
      setError('Password must be 8+ characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      Alert.alert('Password updated', 'You can now sign in with your new password.');
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: spacing?.lg ?? 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xxxl }]}>
          Set New Password
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSize.md }]}>
          Choose a new password for your EVX account
        </Text>

        <EVXInput
          label="New Password"
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secure
          containerStyle={{ marginTop: 24 }}
        />
        <EVXInput
          label="Confirm Password"
          placeholder="********"
          value={confirm}
          onChangeText={setConfirm}
          secure
          containerStyle={{ marginTop: 4 }}
        />

        {!!error && (
          <Text style={{ color: colors.error, marginTop: 4, marginBottom: 8 }}>{error}</Text>
        )}

        <EVXButton
          title={loading ? 'Updating...' : 'Update Password'}
          onPress={handleSubmit}
          disabled={loading}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingVertical: 60 },
  title: { fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center' },
});

export default ResetPasswordScreen;
