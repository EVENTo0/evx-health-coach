import { I18nManager } from 'react-native';
import { en } from './en';
import { ar } from './ar';
import { useAppStore } from '../store';

export type Language = 'en' | 'ar';

export const translations = { en, ar };

export const RTL_LANGUAGES: Language[] = ['ar'];

/**
 * Call this once on app boot (before any UI renders) and again whenever
 * the user changes language. React Native requires a full JS reload to
 * actually flip layout direction, so we return whether a restart is needed.
 */
export function applyRTL(language: Language): { restartRequired: boolean } {
  const shouldBeRTL = RTL_LANGUAGES.includes(language);
  const isCurrentlyRTL = I18nManager.isRTL;

  if (shouldBeRTL !== isCurrentlyRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return { restartRequired: true };
  }
  return { restartRequired: false };
}

/**
 * Hook: returns the translation object for the current language plus
 * a flag for whether we're in RTL mode.
 */
export function useTranslation() {
  const language = useAppStore((s) => s.language) as Language;
  return {
    t: translations[language] ?? translations.en,
    language,
    isRTL: RTL_LANGUAGES.includes(language),
  };
}
