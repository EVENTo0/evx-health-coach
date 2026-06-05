import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export const EVXHeader: React.FC<Props> = ({
  title, subtitle, onBack, rightAction, transparent,
}) => {
  const { colors, spacing, fontSize } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : colors.bg,
          paddingHorizontal: spacing.lg,
          paddingTop: (StatusBar.currentHeight ?? 44) + 8,
          paddingBottom: spacing.md,
          borderBottomColor: transparent ? 'transparent' : colors.border,
          borderBottomWidth: transparent ? 0 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={{ color: colors.primary, fontSize: 22 }}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xl }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSize.sm }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 12, padding: 4 },
  titleContainer: { flex: 1 },
  title: { fontWeight: '700' },
  subtitle: { marginTop: 2 },
  rightAction: {},
});
