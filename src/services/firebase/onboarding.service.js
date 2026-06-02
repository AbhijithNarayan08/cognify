import { db, isMock } from './firebase.config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const mockOnboardingCache = {};

export const onboardingService = {
  /**
   * Persists onboarding choices (intent and target profile values)
   * @param {string} uid User UID
   * @param {string} intent Focus area selection
   * @param {object} profile Profile details (firstName, ageRange, avgSleepBucket, activityLevel)
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  saveOnboardingState: async (uid, intent, profile) => {
    if (!uid) return { success: false, error: "UID is required" };

    const payload = {
      intent,
      profile,
      onboardingCompleted: true,
      updatedAt: isMock ? new Date().toISOString() : serverTimestamp()
    };

    if (isMock) {
      mockOnboardingCache[uid] = payload;
      return { success: true };
    }

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, payload, { merge: true });
      return { success: true };
    } catch (error) {
      console.error("❌ [OnboardingService.saveOnboardingState] Failed:", error);
      return { success: false, error };
    }
  }
};
