/**
 * AppContext — composed store with AsyncStorage persistence & Firebase Auth integration
 */
import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { onboardingInitialState, onboardingReducer } from '../store/slices/onboardingSlice';
import { scoresInitialState, scoresReducer } from '../store/slices/scoresSlice';
import { sessionInitialState, sessionReducer } from '../store/slices/sessionSlice';
import {
  loadOnboarding, loadScores, loadSession,
  saveOnboarding, saveScores, saveSession,
  clearAllStorage
} from '../services/storage';
import { auth } from '../services/firebase';
import { View, ActivityIndicator } from 'react-native';

// ── Compose initial state from slices ─────────────────────────────────────
const initialState = {
  ...onboardingInitialState,
  ...scoresInitialState,
  ...sessionInitialState,
};

// ── Compose reducer from slices ───────────────────────────────────────────
function rootReducer(state, action) {
  // If the RESET action is dispatched, return initial states
  if (action.type === 'RESET') {
    return initialState;
  }
  // Chain reducers sequentially — each sees the previous reducer's output.
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

  // 2. Listen to Firebase auth changes on startup
  useEffect(() => {
    if (!hydrated) return;

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        
        dispatch({
          type: 'SET_USER',
          payload: {
            uid: uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          }
        });

        // Pull Firestore data dynamically to skip onboarding if completed once
        if (!auth.isMock && !uid.startsWith("mock-")) {
          console.log(`🔍 [AppContext] Fetching Firestore cloud profile for user: ${uid}`);
          try {
            // Lazy require services to avoid circular dependencies during initial boot
            const { userService } = require('../services/firebase/user.service');
            const { progressService } = require('../services/firebase/progress.service');
            const { streakService } = require('../services/firebase/streak.service');
            const { sessionService } = require('../services/firebase/session.service');

            const [userProfileRes, progressRes, streakRes] = await Promise.all([
              userService.getUserProfile(uid),
              progressService.getProgress(uid),
              streakService.getStreak(uid)
            ]);

            if (userProfileRes.success && userProfileRes.data) {
              const userData = userProfileRes.data;
              console.log("📥 [AppContext] Firestore profile fetched successfully:", userData);
              
              if (userData.onboardingCompleted) {
                // User has completed onboarding once! Restore onboarding choice to skip Onboarding stack
                dispatch({
                  type: 'REHYDRATE_ONBOARDING',
                  payload: {
                    onboardingComplete: true,
                    intent: userData.intent,
                    profile: userData.profile || {},
                  }
                });

                // Load real score history from progress and sessions
                if (progressRes.success && progressRes.data) {
                  const progressData = progressRes.data;
                  const sessionRes = await sessionService.getRecentSessions(uid, 50);
                  const dbSessions = sessionRes.success ? sessionRes.data : [];

                  const localHistory = dbSessions.map(s => ({
                    date: s.timestamp ? (typeof s.timestamp.toDate === 'function' ? s.timestamp.toDate() : new Date(s.timestamp)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    score: s.score || 600,
                    trained: true,
                    sleep: s.notes?.includes("sleep:") ? parseFloat(s.notes.split("sleep:")[1].split(",")[0]) : 7.5,
                    mood: s.notes?.includes("mood:") ? s.notes.split("mood:")[1].trim() : 'good'
                  })).reverse();

                  dispatch({
                    type: 'REHYDRATE_SCORES',
                    payload: {
                      cognitiveScore: progressData.cognitiveScore || 680,
                      domainScores: progressData.domainScores || null,
                      brainAge: progressData.brainAge || null,
                      cohortPercentile: progressData.cohortPercentile || null,
                      scoreHistory: localHistory,
                    }
                  });
                }

                if (streakRes.success && streakRes.data) {
                  const streakData = streakRes.data;
                  dispatch({
                    type: 'REHYDRATE_SESSION',
                    payload: {
                      streakDays: streakData.streakDays || 0,
                      lastWorkoutDate: streakData.lastWorkoutDate || null,
                      workoutComplete: streakData.lastWorkoutDate === new Date().toISOString().split('T')[0]
                    }
                  });
                }
                
                console.log("⚡️ [AppContext] User profile successfully rehydrated from Firestore. Onboarding bypassed.");
              } else {
                console.log("🔒 [AppContext] Firestore profile exists but onboarding incomplete. Purging dummy onboarding history.");
                dispatch({ type: 'CLEAR_MOCK_HISTORY' });
              }
            } else {
              console.log("🆕 [AppContext] New Firebase user detected. Purging all local onboarding dummy history.");
              dispatch({ type: 'CLEAR_MOCK_HISTORY' });
            }
          } catch (error) {
            console.warn("⚠️ [AppContext] Failed to sync Firestore user profile on auth state change:", error);
          }
        }
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    });

    return unsubscribe;
  }, [hydrated]);

  // 3. Auto-save onboarding slice updates
  useEffect(() => {
    if (hydrated) {
      const { onboardingComplete, intent, profile, user } = state;
      saveOnboarding({ onboardingComplete, intent, profile, user });
    }
  }, [state.onboardingComplete, state.intent, state.profile, state.user, hydrated]);

  // 4. Auto-save scores slice updates
  useEffect(() => {
    if (hydrated) {
      const { cognitiveScore, domainScores, brainAge, cohortPercentile, scoreHistory } = state;
      saveScores({ cognitiveScore, domainScores, brainAge, cohortPercentile, scoreHistory });
    }
  }, [state.cognitiveScore, state.domainScores, state.brainAge, state.cohortPercentile, state.scoreHistory, hydrated]);

  // 5. Auto-save session slice updates
  useEffect(() => {
    if (hydrated) {
      const { workoutComplete, workoutInProgress, checkins, checkinDismissedAt, streakDays, lastWorkoutDate, customFruits } = state;
      saveSession({ workoutComplete, workoutInProgress, checkins, checkinDismissedAt, streakDays, lastWorkoutDate, customFruits });
    }
  }, [
    state.workoutComplete,
    state.workoutInProgress,
    state.checkins,
    state.checkinDismissedAt,
    state.streakDays,
    state.lastWorkoutDate,
    state.customFruits,
    hydrated
  ]);

  // ── Auth Actions ────────────────────────────────────────────────────────
  const loginWithEmail = async (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
  };

  const signupWithEmail = async (email, password) => {
    return auth.createUserWithEmailAndPassword(email, password);
  };

  const loginWithGoogle = async () => {
    const result = await auth.signInWithGoogle();
    if (result && result.user) {
      dispatch({
        type: 'SET_USER',
        payload: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "Google User",
        }
      });
    }
    return result;
  };

  const loginWithApple = async () => {
    const result = await auth.signInWithApple();
    if (result && result.user) {
      dispatch({
        type: 'SET_USER',
        payload: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "Apple User",
        }
      });
    }
    return result;
  };

  const loginWithGoogleCredential = async (idToken) => {
    const result = await auth.signInWithGoogleCredential(idToken);
    if (result && result.user) {
      dispatch({
        type: 'SET_USER',
        payload: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "Google User",
        }
      });
    }
    return result;
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error('Firebase Auth sign out error:', e);
    }
    await clearAllStorage();
    dispatch({ type: 'RESET' });
  };

  if (!hydrated) {
    // Show a clean background loader during rehydration
    return (
      <View style={{ flex: 1, backgroundColor: '#F0EEE8', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F4A041" />
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch, loginWithEmail, signupWithEmail, loginWithGoogle, loginWithApple, loginWithGoogleCredential, logout }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * @returns {{ state: typeof initialState, dispatch: React.Dispatch<any>, loginWithEmail: Function, signupWithEmail: Function, loginWithGoogle: Function, loginWithApple: Function, loginWithGoogleCredential: Function, logout: Function }}
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
