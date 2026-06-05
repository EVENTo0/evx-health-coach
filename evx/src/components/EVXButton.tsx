import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const EVXButton: React.FC<Props> = ({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, style, textStyle, fullWidth = true,
}) => {
  const { colors, radius, fontSize, shadow } = useTheme();

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: fontSize.sm, md: fontSize.md, lg: fontSize.lg };

  const bgColors: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.card,
    ghost: 'transparent',
    danger: colors.error,
  };

  const textColors: Record<string, string> = {
    primary: '#000000',
    secondary: colors.text,
    ghost: colors.primary,
    danger: '#FFFFFF',
  };

  const borderColors: Record<string, string | undefined> = {
    primary: undefined,
    secondary: colors.border,
    ghost: colors.primary,
    danger: undefined,
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          height: heights[size],
          backgroundColor: bgColors[variant],
          borderRadius: radius.lg,
          borderWidth: borderColors[variant] ? 1.5 : 0,
          borderColor: borderColors[variant],
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          paddingHorizontal: fullWidth ? 0 : 24,
        },
        variant === 'primary' && !isDisabled ? shadow.lg : {},
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: textColors[variant], fontSize: fontSizes[size] },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
