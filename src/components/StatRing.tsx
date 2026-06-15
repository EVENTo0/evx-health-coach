import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  progress?: number; // 0–1
  color?: string;
  size?: number;
}

export const StatRing: React.FC<Props> = ({
  label, value, unit, progress = 0, color, size = 80,
}) => {
  const { colors, fontSize } = useTheme();
  const ringColor = color || colors.primary;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={[styles.container, { width: size + 20 }]}>
      <View style={[styles.ring, { width: size, height: size }]}>
        {/* Background ring */}
        <View
          style={[
            styles.bgRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: `${ringColor}22`,
            },
          ]}
        />
        {/* Progress indicator (simplified for RN) */}
        <View
          style={[
            styles.progressRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: ringColor,
              borderTopColor: 'transparent',
              borderRightColor: progress > 0.5 ? ringColor : 'transparent',
              transform: [{ rotate: `${progress * 360 - 90}deg` }],
            },
          ]}
        />
        <View style={styles.center}>
          <Text style={[styles.value, { color: colors.text, fontSize: fontSize.md }]}>
            {value}
          </Text>
          {unit && (
            <Text style={[styles.unit, { color: colors.textTertiary, fontSize: fontSize.xs }]}>
              {unit}
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.label, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6 },
  ring: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  bgRing: { position: 'absolute' },
  progressRing: { position: 'absolute' },
  center: { alignItems: 'center' },
  value: { fontWeight: '700' },
  unit: { marginTop: 1 },
  label: { textAlign: 'center', fontWeight: '500' },
});
