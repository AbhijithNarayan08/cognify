import { db, isMock } from './firebase.config';
import { doc, collection, setDoc, writeBatch, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

// In-Memory mock cache for sessions
const mockSessionCache = {};

export const sessionService = {
  /**
   * Saves a training session and its detailed round logs atomically using a WriteBatch.
   * @param {string} uid User UID
   * @param {object} sessionData Core session data (score, game, duration, etc.)
   * @param {array} roundsArray Detailed round-by-round micro-logs
   * @returns {Promise<{success: boolean, sessionId?: string, error?: any}>}
   */
  saveSession: async (uid, sessionData, roundsArray = []) => {
    if (!uid) return { success: false, error: "UID is required" };

    const sessionId = isMock ? "mock-session-" + Math.random().toString(36).substr(2, 9) : doc(collection(db, 'users')).id;
    const finalSessionData = {
      ...sessionData,
      sessionId,
      timestamp: isMock ? new Date().toISOString() : serverTimestamp(),
      createdAt: isMock ? new Date().toISOString() : serverTimestamp(),
      updatedAt: isMock ? new Date().toISOString() : serverTimestamp(),
    };

    if (isMock) {
      if (!mockSessionCache[uid]) mockSessionCache[uid] = [];
      
      const sessionRecord = {
        ...finalSessionData,
        rounds: roundsArray.map((r, idx) => ({ ...r, roundIndex: idx }))
      };
      mockSessionCache[uid].push(sessionRecord);
      return { success: true, sessionId };
    }

    try {
      const batch = writeBatch(db);
      
      // 1. Session Document
      const sessionRef = doc(db, 'users', uid, 'sessions', sessionId);
      batch.set(sessionRef, finalSessionData);

      // 2. Round Logs in subcollection (max 100 rounds to prevent batch limit issues)
      roundsArray.slice(0, 100).forEach((round, index) => {
        const roundRef = doc(db, 'users', uid, 'sessions', sessionId, 'rounds', index.toString());
        batch.set(roundRef, {
          ...round,
          roundIndex: index,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      // Commit transaction batch atomically
      await batch.commit();
      return { success: true, sessionId };
    } catch (error) {
      console.error("❌ [SessionService.saveSession] Failed:", error);
      return { success: false, error };
    }
  },

  /**
   * Retrieves the user's recent sessions list
   * @param {string} uid 
   * @param {number} sessionLimit 
   * @returns {Promise<{success: boolean, data?: any[], error?: any}>}
   */
  getRecentSessions: async (uid, sessionLimit = 20) => {
    if (!uid) return { success: false, error: "UID is required" };

    if (isMock) {
      const list = mockSessionCache[uid] || [];
      const sorted = [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return { success: true, data: sorted.slice(0, sessionLimit) };
    }

    try {
      const sessionsRef = collection(db, 'users', uid, 'sessions');
      const q = query(sessionsRef, orderBy('timestamp', 'desc'), limit(sessionLimit));
      const querySnap = await getDocs(q);
      const data = querySnap.docs.map(doc => doc.data());
      return { success: true, data };
    } catch (error) {
      console.error("❌ [SessionService.getRecentSessions] Failed:", error);
      return { success: false, error };
    }
  }
};
