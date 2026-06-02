import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { progressService } from '../services/firebase/progress.service';
import { sessionService } from '../services/firebase/session.service';

export function useProgress() {
  const { state } = useApp();
  const uid = state.user?.uid;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);

  const fetchProgress = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    setError(null);

    try {
      const [progResult, sessResult] = await Promise.all([
        progressService.getProgress(uid),
        sessionService.getRecentSessions(uid, 15)
      ]);

      if (!progResult.success) throw new Error(progResult.error);
      if (!sessResult.success) throw new Error(sessResult.error);

      setProgressData(progResult.data);
      setRecentSessions(sessResult.data || []);
    } catch (err) {
      console.error("❌ [useProgress] Fetch failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    loading,
    error,
    progressData,
    recentSessions,
    refresh: fetchProgress
  };
}
