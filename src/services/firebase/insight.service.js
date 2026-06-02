import { db, isMock } from './firebase.config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const mockInsightCache = {};

export const insightService = {
  /**
   * Records a user feedback rating for a coaching insight.
   * Appends insight rating to the user's progress history.
   * @param {string} uid User UID
   * @param {string} insightId 
   * @param {boolean} helpful Whether thumbs up (true) or down (false)
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  logInsightFeedback: async (uid, insightId, helpful) => {
    if (!uid) return { success: false, error: "UID is required" };

    const feedbackItem = {
      insightId,
      helpful,
      timestamp: isMock ? new Date().toISOString() : serverTimestamp()
    };

    if (isMock) {
      if (!mockInsightCache[uid]) mockInsightCache[uid] = [];
      mockInsightCache[uid].push(feedbackItem);
      return { success: true };
    }

    try {
      const progressRef = doc(db, 'userProgress', uid);
      const snap = await getDoc(progressRef);
      
      let insightHistory = [];
      if (snap.exists()) {
        insightHistory = snap.data().insightHistory || [];
      }
      
      // Filter out duplicate feedback for the same insight ID, keep new rating
      insightHistory = insightHistory.filter(item => item.insightId !== insightId);
      insightHistory.push(feedbackItem);

      await setDoc(progressRef, {
        insightHistory,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error("❌ [InsightService.logInsightFeedback] Failed:", error);
      return { success: false, error };
    }
  }
};
