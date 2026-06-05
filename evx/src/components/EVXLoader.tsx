import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export const EVXLoader: React.FC<Props> = ({ message = 'Loading...', fullScreen }) => {
  const { colors, fontSize } = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen ? styles.fullScreen : {},
        { backgroundColor: fullScreen ? colors.bg : 'transparent' },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, { color: colors.textSecondary, fontSize: fontSize.sm }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fullScreen: {
    flex: 1,
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  message: {},
});
