/**
 * AppContext — composed store with AsyncStorage persistence
 */
import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { onboardingInitialState, onboardingReducer } from '../store/slices/onboardingSlice';
import { scoresInitialState, scoresReducer } from '../store/slices/scoresSlice';
import { sessionInitialState, sessionReducer } from '../store/slices/sessionSlice';
import {
  loadOnboarding, loadScores, loadSession,
  saveOnboarding, saveScores, saveSession
} from '../services/storage';
import { View, ActivityIndicator } from 'react-native';

// ── Compose initial state from slices ─────────────────────────────────────
const initialState = {
  ...onboardingInitialState,
  ...scoresInitialState,
  ...sessionInitialState,
};

// ── Compose reducer from slices ───────────────────────────────────────────
function rootReducer(state, action) {
  // If the RESET action is dispatched, clear AsyncStorage and return initial states
  if (action.type === 'RESET') {
    return initialState;
  }
  // Chain reducers sequentially — each sees the previous reducer's output.
  // This prevents later reducers from overwriting earlier ones' changes via ...state.
  let next = onboardingReducer(state, action);
  next = scoresReducer(next, action);
  next = sessionReducer(next, action);
  return next;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // 1. Rehydrate on mount
  useEffect(() => {
    async function bootstrap() {
      try {
        const [savedOnboarding, savedScores, savedSession] = await Promise.all([
          loadOnboarding(),
          loadScores(),
          loadSession(),
        ]);
        
        if (savedOnboarding) {
          dispatch({ type: 'REHYDRATE_ONBOARDING', payload: savedOnboarding });
        }
        if (savedScores) {
          dispatch({ type: 'REHYDRATE_SCORES', payload: savedScores });
        }
        if (savedSession) {
          dispatch({ type: 'REHYDRATE_SESSION', payload: savedSession });
        }
      } catch (e) {
        console.error('Error during app bootstrap:', e);
      } finally {
        setHydrated(true);
      }
    }
    bootstrap();
  }, []);

  // 2. Auto-save onboarding slice updates
  useEffect(() => {
    if (hydrated) {
      const { onboardingComplete, intent, profile } = state;
      saveOnboarding({ onboardingComplete, intent, profile });
    }
  }, [state.onboardingComplete, state.intent, state.profile, hydrated]);

  // 3. Auto-save scores slice updates
  useEffect(() => {
    if (hydrated) {
      const { cognitiveScore, domainScores, brainAge, cohortPercentile, scoreHistory } = state;
      saveScores({ cognitiveScore, domainScores, brainAge, cohortPercentile, scoreHistory });
    }
  }, [state.cognitiveScore, state.domainScores, state.brainAge, state.cohortPercentile, state.scoreHistory, hydrated]);

  // 4. Auto-save session slice updates
  useEffect(() => {
    if (hydrated) {
      const { workoutComplete, workoutInProgress, checkins, checkinDismissedAt, streakDays, lastWorkoutDate } = state;
      saveSession({ workoutComplete, workoutInProgress, checkins, checkinDismissedAt, streakDays, lastWorkoutDate });
    }
  }, [
    state.workoutComplete,
    state.workoutInProgress,
    state.checkins,
    state.checkinDismissedAt,
    state.streakDays,
    state.lastWorkoutDate,
    hydrated
  ]);

  if (!hydrated) {
    // Show a clean background loader during rehydration
    return (
      <View style={{ flex: 1, backgroundColor: '#F0EEE8', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F4A041" />
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * @returns {{ state: typeof initialState, dispatch: React.Dispatch<any> }}
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
