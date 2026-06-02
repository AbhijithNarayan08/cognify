import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { adaptiveService } from '../services/firebase/adaptive.service';

export function useAdaptive() {
  const { state } = useApp();
  const uid = state.user?.uid;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adaptiveData, setAdaptiveData] = useState(null);

  const fetchAdaptive = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await adaptiveService.getAdaptiveState(uid);
      if (!result.success) throw new Error(result.error);
      setAdaptiveData(result.data);
    } catch (err) {
      console.error("❌ [useAdaptive] Fetch failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAdaptive();
  }, [fetchAdaptive]);

  /**
   * Updates adaptive progress variables and suggestions for a specific game
   * @param {string} gameId 
   * @param {object} gamePayload 
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  const updateGameDifficulty = async (gameId, gamePayload) => {
    if (!uid) return { success: false, error: "Authentication required" };

    try {
      const result = await adaptiveService.updateGameAdaptiveDetails(uid, gameId, gamePayload);
      if (!result.success) throw new Error(result.error);
      
      // Update state local value on success
      await fetchAdaptive();
      return { success: true };
    } catch (err) {
      console.error("❌ [useAdaptive.updateGameDifficulty] Failed:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    loading,
    error,
    adaptiveData,
    updateGameDifficulty,
    refresh: fetchAdaptive
  };
}
