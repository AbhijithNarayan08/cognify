/**
 * useInsights — derives display-ready insights data from app state.
 * Extracted from InsightsScreen to separate data transformation from rendering.
 */
import { useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { INSIGHT_TEMPLATES, WEEKLY_BRIEF } from '../../../data/exercises';
import { get14DaysDummyData } from '../../../data/dummyData';
import { calculatePearson, calculateRegressionSlope, getLifestyleRating } from '../../../shared/utils/analytics';

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

  // 1. Compute Pearson Correlations for all 3 lifestyle habits x 6 domains
  const correlations = useMemo(() => {
    const habits = ['sleep', 'mood', 'activity'];
    const domains = ['memory', 'speed', 'attention', 'executive', 'verbal', 'spatial'];
    const result = { sleep: {}, mood: {}, activity: {} };

    habits.forEach(habit => {
      domains.forEach(domain => {
        // Extract paired data points
        const X = [];
        const Y = [];
        
        activeScoreHistory.forEach(h => {
          const habitVal = getLifestyleRating(habit, h[habit]);
          const domainVal = h.domains?.[domain] || h.score || 700;
          
          X.push(habitVal);
          Y.push(domainVal);
        });

        // Compute Pearson correlation r
        result[habit][domain] = calculatePearson(X, Y);
      });
    });

    return result;
  }, [activeScoreHistory]);

  // 2. Compute 7-day future regression projections
  const projections = useMemo(() => {
    const currentScore = cognitiveScore || 742;
    const slope = calculateRegressionSlope(activeScoreHistory);
    
    // Project standard score 7 days out
    const standardProjected = Math.max(300, Math.min(1000, Math.round(currentScore + 7 * slope)));
    
    // Project optimized score 7 days out with compound +0.82 trajectory multiplier
    const optimizedProjected = Math.max(300, Math.min(1000, Math.round(currentScore + 7 * (slope + 0.82))));

    return {
      slope,
      standardProjected,
      optimizedProjected,
    };
  }, [activeScoreHistory, cognitiveScore]);

  // 3. True user history calibration status
  const calibrationComplete = scoreHistory && scoreHistory.length >= 5;

  return {
    cognitiveScore,
    domainScores,
    scoreHistory: activeScoreHistory,
    cohortPercentile,
    insightTemplates: INSIGHT_TEMPLATES,
    weeklyBrief: WEEKLY_BRIEF,
    last7Avg,
    correlations,
    projections,
    calibrationComplete,
  };
}
