import { db, isMock } from './firebase.config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const mockAdaptiveCache = {};

export const adaptiveService = {
  /**
   * Retrieves the current adaptive difficulty state across all games
   * @param {string} uid 
   * @returns {Promise<{success: boolean, data?: any, error?: any}>}
   */
  getAdaptiveState: async (uid) => {
    if (!uid) return { success: false, error: "UID is required" };

    if (isMock) {
      const cached = mockAdaptiveCache[uid] || {
        uid,
        lighthouse_watch: { currentLevel: 1, sessionsSinceChange: 0, pendingSuggestion: null },
        context_switch: { currentLevel: 1, sessionsSinceChange: 0, pendingSuggestion: null },
        pattern_fold: { currentLevel: 1, sessionsSinceChange: 0, pendingSuggestion: null }
      };
      return { success: true, data: cached };
    }

    try {
      const adaptiveRef = doc(db, 'adaptiveState', uid);
      const snap = await getDoc(adaptiveRef);
      if (snap.exists()) {
        return { success: true, data: snap.data() };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error("❌ [AdaptiveService.getAdaptiveState] Failed:", error);
      return { success: false, error };
    }
  },

  /**
   * Updates adaptive details for a specific game
   * @param {string} uid 
   * @param {string} gameId 
   * @param {object} gamePayload 
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  updateGameAdaptiveDetails: async (uid, gameId, gamePayload) => {
    if (!uid) return { success: false, error: "UID is required" };

    if (isMock) {
      const current = mockAdaptiveCache[uid] || {
        uid,
        lighthouse_watch: { currentLevel: 1, sessionsSinceChange: 0, pendingSuggestion: null },
        context_switch: { currentLevel: 1, sessionsSinceChange: 0, pendingSuggestion: null },
        pattern_fold: { currentLevel: 1, sessionsSinceChange: 0, pendingSuggestion: null }
      };
      
      current[gameId] = {
        ...current[gameId],
        ...gamePayload
      };
      mockAdaptiveCache[uid] = current;
      return { success: true };
    }

    try {
      const adaptiveRef = doc(db, 'adaptiveState', uid);
      await setDoc(adaptiveRef, {
        [gameId]: gamePayload,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error("❌ [AdaptiveService.updateGameAdaptiveDetails] Failed:", error);
      return { success: false, error };
    }
  }
};
