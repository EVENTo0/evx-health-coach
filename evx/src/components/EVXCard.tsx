import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  glowColor?: string;
  padding?: number;
}

export const EVXCard: React.FC<Props> = ({
  children, style, elevated, glowColor, padding,
}) => {
  const { colors, radius, shadow } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.cardElevated : colors.card,
          borderRadius: radius.xl,
          borderColor: glowColor ? `${glowColor}30` : colors.border,
          padding: padding ?? 16,
        },
        glowColor ? {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 8,
        } : shadow.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
