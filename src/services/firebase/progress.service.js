import { db, isMock } from './firebase.config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// In-Memory mock cache for user progress summaries
const mockProgressCache = {};

export const progressService = {
  /**
   * Retrieves the denormalized user progress summary document
   * @param {string} uid 
   * @returns {Promise<{success: boolean, data?: any, error?: any}>}
   */
  getProgress: async (uid) => {
    if (!uid) return { success: false, error: "UID is required" };

    if (isMock) {
      const cached = mockProgressCache[uid] || {
        uid,
        cognitiveScore: 680,
        domainScores: { memory: 695, speed: 650, attention: 715, executive: 665, verbal: 705, spatial: 655 },
        brainAge: 29,
        cohortPercentile: 78,
        personalBests: {},
        rollingAverages: {},
        patternFrequency: {},
        insightHistory: []
      };
      return { success: true, data: cached };
    }

    try {
      const progressRef = doc(db, 'userProgress', uid);
      const snap = await getDoc(progressRef);
      if (snap.exists()) {
        return { success: true, data: snap.data() };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error("❌ [ProgressService.getProgress] Failed:", error);
      return { success: false, error };
    }
  },

  /**
   * Updates progress rolling averages, domain scores, and personal bests.
   * @param {string} uid 
   * @param {object} progressData 
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  updateProgress: async (uid, progressData) => {
    if (!uid) return { success: false, error: "UID is required" };

    const payload = {
      ...progressData,
      updatedAt: isMock ? new Date().toISOString() : serverTimestamp()
    };

    if (isMock) {
      mockProgressCache[uid] = {
        ...(mockProgressCache[uid] || {
          uid,
          cognitiveScore: 680,
          domainScores: { memory: 695, speed: 650, attention: 715, executive: 665, verbal: 705, spatial: 655 },
          brainAge: 29,
          cohortPercentile: 78,
          personalBests: {},
          rollingAverages: {},
          patternFrequency: {},
          insightHistory: []
        }),
        ...payload,
      };
      return { success: true };
    }

    try {
      const progressRef = doc(db, 'userProgress', uid);
      await setDoc(progressRef, payload, { merge: true });
      return { success: true };
    } catch (error) {
      console.error("❌ [ProgressService.updateProgress] Failed:", error);
      return { success: false, error };
    }
  }
};
