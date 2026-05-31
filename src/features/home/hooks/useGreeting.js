import { t } from '../../../constants/useStrings';

/**
 * useGreeting — returns a time-aware greeting string.
 * Extracted from HomeScreen to keep it pure and testable.
 */
export function useGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t('home.greeting.morning');
  if (h < 18) return t('home.greeting.afternoon');
  return t('home.greeting.evening');
}
