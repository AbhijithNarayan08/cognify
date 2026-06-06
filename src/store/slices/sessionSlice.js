// ── Session Slice ─────────────────────────────────────────────────────────
export const sessionInitialState = {
  workoutComplete: false,
  workoutInProgress: false,
  checkins: {
    sleep: null,
    activity: null,
    mood: null,
  },
  checkinDismissedAt: {
    sleep: null,
    activity: null,
    mood: null,
  },
  streakDays: 0,
  lastWorkoutDate: null,
  customFruits: [],
};

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING': {
      const todayStr = new Date().toISOString().split('T')[0];
      return {
        ...state,
        streakDays: 1,
        lastWorkoutDate: todayStr,
        workoutComplete: true,
      };
    }
    case 'SET_CHECKIN':
      return { ...state, checkins: { ...state.checkins, [action.key]: action.value } };
    case 'SAVE_CUSTOM_FRUIT':
      return {
        ...state,
        customFruits: [action.payload, ...(state.customFruits || [])],
      };
    case 'SAVE_CUSTOM_FRUIT_LIST':
      return {
        ...state,
        customFruits: action.payload,
      };
    case 'DISMISS_CHECKIN':
      return {
        ...state,
        checkinDismissedAt: {
          ...state.checkinDismissedAt,
          [action.key]: Date.now(),
        },
      };
    case 'COMPLETE_WORKOUT': {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastWorkout = state.lastWorkoutDate;
      let newStreak = state.streakDays;
      if (lastWorkout !== todayStr) {
        newStreak = (state.streakDays || 0) + 1;
      }
      return {
        ...state,
        workoutComplete: true,
        workoutInProgress: false,
        streakDays: newStreak,
        lastWorkoutDate: todayStr,
      };
    }
    case 'START_WORKOUT':
      return { ...state, workoutInProgress: true };
    case 'REHYDRATE_SESSION': {
      const persisted = action.payload || {};
      const todayStr = new Date().toISOString().split('T')[0];
      
      let streak = persisted.streakDays || 0;
      let workoutComplete = persisted.workoutComplete || false;
      const lastWorkout = persisted.lastWorkoutDate;
      
      if (lastWorkout) {
        const today = new Date(todayStr);
        const last = new Date(lastWorkout);
        const diffTime = today - last;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          workoutComplete = true;
        } else if (diffDays === 1) {
          workoutComplete = false;
        } else {
          streak = 0;
          workoutComplete = false;
        }
      } else {
        streak = 0;
        workoutComplete = false;
      }
      
      return {
        ...state,
        ...persisted,
        streakDays: streak,
        workoutComplete,
        checkins: persisted.checkins || sessionInitialState.checkins,
        checkinDismissedAt: persisted.checkinDismissedAt || sessionInitialState.checkinDismissedAt,
        customFruits: persisted.customFruits || sessionInitialState.customFruits,
      };
    }
    case 'RESET':
      return sessionInitialState;
    default:
      return state;
  }
}
