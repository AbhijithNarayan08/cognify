import { db, isMock } from './firebase.config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// In-Memory fallback cache for Mock Mode
const mockUserCache = {};

export const userService = {
  /**
   * Retrieves a user profile document by UID
   * @param {string} uid 
   * @returns {Promise<{success: boolean, data?: any, error?: any}>}
   */
  getUserProfile: async (uid) => {
    if (!uid) return { success: false, error: "UID is required" };
    
    if (isMock) {
      const cached = mockUserCache[uid] || {
        uid,
        email: "demo-user@cognify.app",
        displayName: "Jane Doe",
        authProvider: "email",
        onboardingCompleted: false,
        introAnimationSeen: false,
        profile: { firstName: "there", ageRange: null, avgSleepBucket: null, activityLevel: null },
        notificationsEnabled: false,
        reminderTime: null,
        firstSessionCompleted: {},
      };
      return { success: true, data: cached };
    }

    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { success: true, data: userSnap.data() };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error("❌ [UserService.getUserProfile] Failed:", error);
      return { success: false, error };
    }
  },

  /**
   * Creates or updates a user profile document
   * @param {string} uid 
   * @param {object} data 
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  updateUserProfile: async (uid, data) => {
    if (!uid) return { success: false, error: "UID is required" };

    const payload = {
      ...data,
      updatedAt: isMock ? new Date().toISOString() : serverTimestamp()
    };

    if (isMock) {
      mockUserCache[uid] = {
        ...(mockUserCache[uid] || {}),
        ...payload,
        uid,
      };
      return { success: true };
    }

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, payload, { merge: true });
      return { success: true };
    } catch (error) {
      console.error("❌ [UserService.updateUserProfile] Failed:", error);
      return { success: false, error };
    }
  },

  /**
   * Syncs onboarding choices dynamically
   * @param {string} uid 
   * @param {object} profileValues 
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  saveOnboardingProfile: async (uid, profileValues) => {
    return userService.updateUserProfile(uid, { profile: profileValues });
  }
};
