import { db, isMock } from './firebase.config';
import { doc, runTransaction, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// In-Memory mock cache for streaks
const mockStreakCache = {};

export const streakService = {
  /**
   * Retrieves the user's streak document
   * @param {string} uid 
   * @returns {Promise<{success: boolean, data?: any, error?: any}>}
   */
  getStreak: async (uid) => {
    if (!uid) return { success: false, error: "UID is required" };

    if (isMock) {
      const cached = mockStreakCache[uid] || {
        uid,
        streakDays: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
        freezesOwned: 1,
        freezeUsageLog: [],
        weeklyActivity: { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false },
        lifetimeSessions: 0,
        lifetimeDays: 0
      };
      return { success: true, data: cached };
    }

    try {
      const streakRef = doc(db, 'streaks', uid);
      const snap = await getDoc(streakRef);
      if (snap.exists()) {
        return { success: true, data: snap.data() };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error("❌ [StreakService.getStreak] Failed:", error);
      return { success: false, error };
    }
  },

  /**
   * Atomically records a training day, incrementing the streak count and updating lifetime stats.
   * Runs as a Firestore transaction to prevent race conditions across multiple devices.
   * @param {string} uid 
   * @returns {Promise<{success: boolean, newStreak?: number, error?: any}>}
   */
  recordTrainingDay: async (uid) => {
    if (!uid) return { success: false, error: "UID is required" };
    
    const todayStr = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (isMock) {
      const current = mockStreakCache[uid] || {
        uid,
        streakDays: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
        freezesOwned: 1,
        freezeUsageLog: [],
        weeklyActivity: { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false },
        lifetimeSessions: 0,
        lifetimeDays: 0
      };

      let newStreak = current.streakDays;
      let isNewDay = false;

      if (current.lastWorkoutDate !== todayStr) {
        isNewDay = true;
        if (!current.lastWorkoutDate) {
          newStreak = 1;
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (current.lastWorkoutDate === yesterdayStr) {
            newStreak = current.streakDays + 1;
          } else {
            // Check if streak was saved by a freeze. For mock, reset to 1 if not yesterday
            newStreak = 1;
          }
        }
      }

      const updated = {
        ...current,
        streakDays: newStreak,
        longestStreak: Math.max(current.longestStreak, newStreak),
        lastWorkoutDate: todayStr,
        weeklyActivity: {
          ...current.weeklyActivity,
          [dayOfWeek]: true
        },
        lifetimeSessions: current.lifetimeSessions + 1,
        lifetimeDays: current.lifetimeDays + (isNewDay ? 1 : 0),
        updatedAt: new Date().toISOString()
      };

      mockStreakCache[uid] = updated;
      return { success: true, newStreak };
    }

    try {
      const streakRef = doc(db, 'streaks', uid);
      
      const newStreak = await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(streakRef);
        
        let current = {
          streakDays: 0,
          longestStreak: 0,
          lastWorkoutDate: null,
          freezesOwned: 1,
          freezeUsageLog: [],
          weeklyActivity: { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false },
          lifetimeSessions: 0,
          lifetimeDays: 0
        };

        if (docSnap.exists()) {
          current = docSnap.data();
        }

        let isNewDay = false;
        let finalStreak = current.streakDays;

        if (current.lastWorkoutDate !== todayStr) {
          isNewDay = true;
          if (!current.lastWorkoutDate) {
            finalStreak = 1;
          } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (current.lastWorkoutDate === yesterdayStr) {
              finalStreak = current.streakDays + 1;
            } else {
              // Streak broken
              finalStreak = 1;
            }
          }
        }

        const nextPayload = {
          ...current,
          uid,
          streakDays: finalStreak,
          longestStreak: Math.max(current.longestStreak, finalStreak),
          lastWorkoutDate: todayStr,
          weeklyActivity: {
            ...current.weeklyActivity,
            [dayOfWeek]: true
          },
          lifetimeSessions: current.lifetimeSessions + 1,
          lifetimeDays: current.lifetimeDays + (isNewDay ? 1 : 0),
          updatedAt: serverTimestamp()
        };

        if (!docSnap.exists()) {
          nextPayload.createdAt = serverTimestamp();
          transaction.set(streakRef, nextPayload);
        } else {
          transaction.update(streakRef, nextPayload);
        }

        return finalStreak;
      });

      return { success: true, newStreak };
    } catch (error) {
      console.error("❌ [StreakService.recordTrainingDay] Failed:", error);
      return { success: false, error };
    }
  },

  /**
   * Atomically consumes a streak freeze to save the current streak count.
   * Runs inside a transaction.
   * @param {string} uid 
   * @returns {Promise<{success: boolean, freezesRemaining?: number, error?: any}>}
   */
  consumeStreakFreeze: async (uid) => {
    if (!uid) return { success: false, error: "UID is required" };

    if (isMock) {
      const current = mockStreakCache[uid] || { freezesOwned: 0, freezeUsageLog: [] };
      if (current.freezesOwned <= 0) {
        return { success: false, error: "No freezes owned" };
      }
      
      const updated = {
        ...current,
        freezesOwned: current.freezesOwned - 1,
        freezeUsageLog: [...current.freezeUsageLog, new Date().toISOString()],
        updatedAt: new Date().toISOString()
      };
      mockStreakCache[uid] = updated;
      return { success: true, freezesRemaining: updated.freezesOwned };
    }

    try {
      const streakRef = doc(db, 'streaks', uid);
      
      const freezesRemaining = await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(streakRef);
        if (!docSnap.exists()) {
          throw new Error("Streak record does not exist");
        }
        
        const data = docSnap.data();
        if (data.freezesOwned <= 0) {
          throw new Error("No freezes owned");
        }

        const nextFreezes = data.freezesOwned - 1;
        transaction.update(streakRef, {
          freezesOwned: nextFreezes,
          freezeUsageLog: [...(data.freezeUsageLog || []), serverTimestamp()],
          updatedAt: serverTimestamp()
        });

        return nextFreezes;
      });

      return { success: true, freezesRemaining };
    } catch (error) {
      console.error("❌ [StreakService.consumeStreakFreeze] Failed:", error);
      return { success: false, error };
    }
  }
};
