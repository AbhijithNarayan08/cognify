import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { streakService } from '../services/firebase/streak.service';

export function useStreak() {
  const { state } = useApp();
  const uid = state.user?.uid;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streakData, setStreakData] = useState(null);

  const fetchStreak = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await streakService.getStreak(uid);
      if (!result.success) throw new Error(result.error);
      setStreakData(result.data);
    } catch (err) {
      console.error("❌ [useStreak] Fetch failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const useStreakFreeze = async () => {
    if (!uid) return { success: false, error: "Authentication required" };

    setLoading(true);
    try {
      const result = await streakService.consumeStreakFreeze(uid);
      if (!result.success) throw new Error(result.error);

      // Refresh streak data locally on success
      await fetchStreak();
      return { success: true, freezesRemaining: result.freezesRemaining };
    } catch (err) {
      console.error("❌ [useStreak.useStreakFreeze] Failed:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    streakDays: streakData?.streakDays || 0,
    longestStreak: streakData?.longestStreak || 0,
    freezesOwned: streakData?.freezesOwned || 0,
    weeklyActivity: streakData?.weeklyActivity || {},
    useStreakFreeze,
    refresh: fetchStreak
  };
}
