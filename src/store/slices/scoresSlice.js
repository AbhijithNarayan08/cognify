// ── Scores Slice ──────────────────────────────────────────────────────────
import { get14DaysDummyData } from '../../data/dummyData';
// Generate 30-day mock score history with realistic variance
export function generateMockHistory(baseScore) {
  const history = [];
  let score = baseScore - 80;
  for (let i = 29; i >= 0; i--) {
    score += Math.floor(Math.random() * 16 - 4); // -4 to +12 drift
    score = Math.max(420, Math.min(980, score));
    const date = new Date();
    date.setDate(date.getDate() - i);
    history.push({ date: date.toISOString().split('T')[0], score: Math.round(score) });
  }
  return history;
}

export const scoresInitialState = {
  cognitiveScore: null,
  domainScores: null, // { memory, speed, attention, executive, verbal, spatial }
  brainAge: null,
  cohortPercentile: null,
  scoreHistory: [],
};

export function scoresReducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_ASSESSMENT':
      return {
        ...state,
        cognitiveScore: action.payload.cognitiveScore,
        domainScores: action.payload.domainScores,
        brainAge: action.payload.brainAge,
        cohortPercentile: action.payload.cohortPercentile,
      };
    case 'COMPLETE_ONBOARDING':
      const finalScore = action.payload?.cognitiveScore || state.cognitiveScore || 680;
      const defaultDomains = {
        memory: Math.round(finalScore + 15),
        speed: Math.round(finalScore - 30),
        attention: Math.round(finalScore + 35),
        executive: Math.round(finalScore - 15),
        verbal: Math.round(finalScore + 25),
        spatial: Math.round(finalScore - 25),
      };
      return {
        ...state,
        streakDays: 1,
        cognitiveScore: finalScore,
        domainScores: state.domainScores || defaultDomains,
        scoreHistory: get14DaysDummyData(finalScore),
      };
    case 'COMPLETE_WORKOUT': {
      const todayStr = new Date().toISOString().split('T')[0];
      const scoreDelta = action.payload?.scoreDelta || Math.floor(Math.random() * 20 + 5);
      const newCognitiveScore = (state.cognitiveScore || 0) + scoreDelta;
      
      let updatedDomainScores = { ...state.domainScores };
      if (action.payload?.domain && action.payload?.sessionScore !== undefined) {
        const prevDomainScore = state.domainScores?.[action.payload.domain] ?? state.cognitiveScore ?? 600;
        const nextDomainScore = Math.round(prevDomainScore * 0.7 + action.payload.sessionScore * 0.3);
        updatedDomainScores[action.payload.domain] = nextDomainScore;
      }

      let newHistory = [...(state.scoreHistory || [])];
      const lastWorkout = state.scoreHistory?.[state.scoreHistory.length - 1] || {};
      newHistory.push({
        date: todayStr,
        score: newCognitiveScore,
        sleep: action.payload?.sleep ?? lastWorkout.sleep ?? 7.5,
        trained: true,
        mood: action.payload?.mood ?? lastWorkout.mood ?? 'good',
        domains: updatedDomainScores,
      });
      if (newHistory.length > 90) {
        newHistory = newHistory.slice(newHistory.length - 90);
      }

      return {
        ...state,
        cognitiveScore: newCognitiveScore,
        domainScores: updatedDomainScores,
        scoreHistory: newHistory,
      };
    }
    case 'REHYDRATE_SCORES':
      return { ...state, ...action.payload };
    case 'RESET':
      return scoresInitialState;
    default:
      return state;
  }
}
