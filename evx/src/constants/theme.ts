// EVX Design System — Premium Health Tech

export const Colors = {
  // Brand
  primary: '#00D4FF',
  primaryDark: '#0099BB',
  primaryLight: '#66E5FF',
  accent: '#FF6B35',
  accentGreen: '#00E096',
  accentPurple: '#A855F7',

  // Dark Mode
  dark: {
    bg: '#0A0A0F',
    surface: '#12121A',
    card: '#1A1A26',
    cardElevated: '#22222E',
    border: '#2A2A3A',
    borderLight: '#333344',
    text: '#FFFFFF',
    textSecondary: '#A0A0B8',
    textTertiary: '#606080',
    textMuted: '#404058',
  },

  // Light Mode
  light: {
    bg: '#F5F5FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardElevated: '#F8F8FD',
    border: '#E0E0EE',
    borderLight: '#EFEFFA',
    text: '#0A0A1A',
    textSecondary: '#4A4A6A',
    textTertiary: '#8A8AAA',
    textMuted: '#BABACE',
  },

  // Semantic
  success: '#00E096',
  warning: '#FFB800',
  error: '#FF4444',
  info: '#00D4FF',

  // Gradients (as arrays)
  gradients: {
    primary: ['#00D4FF', '#0099BB'],
    accent: ['#FF6B35', '#FF3366'],
    green: ['#00E096', '#00B87A'],
    purple: ['#A855F7', '#7C3AED'],
    dark: ['#12121A', '#0A0A0F'],
    card: ['#1A1A26', '#12121A'],
    hero: ['#00D4FF22', '#0A0A0F'],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  round: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const AnimationDuration = {
  fast: 150,
  normal: 250,
  slow: 400,
};
