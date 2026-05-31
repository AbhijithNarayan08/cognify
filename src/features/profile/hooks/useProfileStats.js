/**
 * useProfileStats — derives display-ready stats from app state.
 * Extracted from ProfileScreen to separate data derivation from rendering.
 */
import { useMemo } from 'react';
import { useApp } from '../../../context/AppContext';

export function useProfileStats() {
  const { state } = useApp();
  const { scoreHistory, cognitiveScore, streakDays } = state;

  const totalSessions = scoreHistory?.length || 1;

  const avgScore = useMemo(() => {
    if (scoreHistory?.length) {
      return Math.round(scoreHistory.reduce((s, h) => s + h.score, 0) / scoreHistory.length);
    }
    return cognitiveScore || 742;
  }, [scoreHistory, cognitiveScore]);

  return { totalSessions, avgScore, streakDays };
}
