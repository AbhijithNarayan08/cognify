/**
 * useInsights — derives display-ready insights data from app state.
 * Extracted from InsightsScreen to separate data transformation from rendering.
 */
import { useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { INSIGHT_TEMPLATES, WEEKLY_BRIEF } from '../../../data/exercises';
import { get14DaysDummyData } from '../../../data/dummyData';

export function useInsights() {
  const { state } = useApp();
  const { cognitiveScore, domainScores, scoreHistory, cohortPercentile } = state;

  const activeScoreHistory = useMemo(() => {
    if (!scoreHistory || scoreHistory.length === 0) {
      return get14DaysDummyData(cognitiveScore || 742);
    }
    return scoreHistory;
  }, [scoreHistory, cognitiveScore]);

  const last7Avg = useMemo(() => {
    if (!activeScoreHistory?.length) return null;
    const last7 = activeScoreHistory.slice(-7).map(h => h.score);
    return Math.round(last7.reduce((a, b) => a + b, 0) / last7.length);
  }, [activeScoreHistory]);

  return {
    cognitiveScore,
    domainScores,
    scoreHistory: activeScoreHistory,
    cohortPercentile,
    insightTemplates: INSIGHT_TEMPLATES,
    weeklyBrief: WEEKLY_BRIEF,
    last7Avg,
  };
}
