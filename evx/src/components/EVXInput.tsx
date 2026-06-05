import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  TextInputProps, ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  secure?: boolean;
}

export const EVXInput: React.FC<Props> = ({
  label, error, hint, rightIcon, leftIcon, containerStyle,
  secure, ...props
}) => {
  const { colors, radius, fontSize, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.sm }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderRadius: radius.lg,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          {...props}
          secureTextEntry={secure && !showPassword}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: fontSize.md,
              flex: 1,
              paddingLeft: leftIcon ? 0 : 16,
              paddingRight: (rightIcon || secure) ? 0 : 16,
            },
          ]}
          placeholderTextColor={colors.textMuted}
        />
        {secure ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Text style={{ color: colors.textTertiary, fontSize: fontSize.sm }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error, fontSize: fontSize.xs }]}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textTertiary, fontSize: fontSize.xs }]}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 6, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    overflow: 'hidden',
  },
  input: { paddingVertical: 0 },
  leftIcon: { paddingHorizontal: 14 },
  rightIcon: { paddingHorizontal: 14 },
  error: { marginTop: 4, marginLeft: 4 },
  hint: { marginTop: 4, marginLeft: 4 },
});
