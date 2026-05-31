// src/utils/haptics.js
import * as Haptics from 'expo-haptics';

export const GameHaptics = {
  correct: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.warn('[Haptics] Light impact failed:', e);
    }
  },
  incorrect: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      console.warn('[Haptics] Error notification failed:', e);
    }
  },
  streakMilestone: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      console.warn('[Haptics] Heavy impact failed:', e);
    }
  },
};
