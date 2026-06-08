import { useAppStore } from '../store';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../constants/theme';

export const useTheme = () => {
  const { theme, toggleTheme } = useAppStore();
  const isDark = theme === 'dark';
  const c = isDark ? Colors.dark : Colors.light;

  return {
    theme,
    isDark,
    toggleTheme,
    colors: {
      ...c,
      background: c.bg,   // alias so screens can use colors.background
      primary: Colors.primary,
      primaryDark: Colors.primaryDark,
      primaryLight: Colors.primaryLight,
      accent: Colors.accent,
      accentGreen: Colors.accentGreen,
      accentPurple: Colors.accentPurple,
      success: Colors.success,
      warning: Colors.warning,
      error: Colors.error,
      info: Colors.info,
      gradients: Colors.gradients,
    },
    spacing: Spacing,
    radius: BorderRadius,
    fontSize: FontSize,
    shadow: Shadow,
  };
};
