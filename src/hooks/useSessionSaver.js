import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sessionService } from '../services/firebase/session.service';
import { progressService } from '../services/firebase/progress.service';
import { streakService } from '../services/firebase/streak.service';

export function useSessionSaver() {
  const { state, dispatch } = useApp();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Saves a completed training session, updates streaks, and commits progress aggregates.
   * @param {object} sessionPayload Core session stats (score, game, duration)
   * @param {array} roundsArray Detailed round logs for subcollection
   * @returns {Promise<{success: boolean, sessionId?: string, error?: any}>}
   */
  const saveCompletedSession = async (sessionPayload, roundsArray = []) => {
    const uid = state.user?.uid;
    if (!uid) {
      return { success: false, error: "User is not authenticated" };
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Save Session & Rounds atomically in subcollections
      const sessionResult = await sessionService.saveSession(uid, sessionPayload, roundsArray);
      if (!sessionResult.success) throw new Error(sessionResult.error);

      // 2. Increment user streaks atomically using transactions
      const streakResult = await streakService.recordTrainingDay(uid);
      if (!streakResult.success) throw new Error(streakResult.error);

      // 3. Compute and update denormalized progress summaries
      const prevProgress = await progressService.getProgress(uid);
      const prevData = prevProgress.data || {};

      const currentScore = sessionPayload.score || 0;
      const gameId = sessionPayload.game;
      
      // Update personal bests
      const nextPBs = { ...(prevData.personalBests || {}) };
      const currentPB = nextPBs[gameId] || 0;
      if (currentScore > currentPB) {
        nextPBs[gameId] = currentScore;
      }

      // Update rolling averages (last 5 sessions)
      const nextRolling = { ...(prevData.rollingAverages || {}) };
      const gameRolling = nextRolling[gameId] || { count: 0, scoreAvg: 0 };
      const nextCount = Math.min(5, (gameRolling.count || 0) + 1);
      const nextScoreAvg = Math.round(((gameRolling.scoreAvg || 0) * (nextCount - 1) + currentScore) / nextCount);
      nextRolling[gameId] = { count: nextCount, scoreAvg: nextScoreAvg };

      // Update overall cognitive score (dynamic baseline updates)
      const prevCognitive = state.cognitiveScore ?? prevData.cognitiveScore ?? 600;
      const nextCognitive = Math.round(prevCognitive * 0.95 + currentScore * 0.05);

      const progressPayload = {
        ...prevData,
        cognitiveScore: nextCognitive,
        personalBests: nextPBs,
        rollingAverages: nextRolling
      };
      
      const progressResult = await progressService.updateProgress(uid, progressPayload);
      if (!progressResult.success) throw new Error(progressResult.error);

      // 4. Update the local state context dynamically so UI updates instantly
      dispatch({
        type: 'COMPLETE_WORKOUT',
        payload: {
          scoreDelta: Math.max(5, Math.round(currentScore * 0.05)),
          sessionScore: currentScore,
          domain: gameId === 'lighthouse_watch' ? 'attention' : gameId === 'context_switch' ? 'executive' : 'spatial'
        }
      });

      setSaving(false);
      return { success: true, sessionId: sessionResult.sessionId };
    } catch (err) {
      console.error("❌ [useSessionSaver] Failed saving session:", err);
      setError(err.message);
      setSaving(false);
      return { success: false, error: err.message };
    }
  };

  return { saveCompletedSession, saving, error };
}
