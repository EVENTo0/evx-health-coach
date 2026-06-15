import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onFinish: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const { colors } = useTheme();
  const logoScale = new Animated.Value(0.3);
  const logoOpacity = new Animated.Value(0);
  const tagOpacity = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(800),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <View style={[styles.logoRing, { borderColor: `${colors.primary}30` }]}>
          <View style={[styles.logoInner, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.logoText, { color: colors.primary }]}>EVX</Text>
          </View>
        </View>
      </Animated.View>
      <Animated.Text
        style={[styles.tagline, { color: colors.textSecondary, opacity: tagOpacity }]}
      >
        AI Health, Fitness & Nutrition Coach
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logoContainer: { alignItems: 'center' },
  logoRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});
