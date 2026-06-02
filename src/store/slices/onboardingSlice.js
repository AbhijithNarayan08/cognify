// ── Onboarding Slice ──────────────────────────────────────────────────────
export const onboardingInitialState = {
  onboardingComplete: false,
  user: null, // Firebase user or mock user object (or null)
  intent: null, // 'sharpen' | 'focus' | 'protect' | 'curious'
  profile: {
    firstName: 'there',
    ageRange: null,
    avgSleepBucket: null,
    activityLevel: null,
  },
};

export function onboardingReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_INTENT':
      return { ...state, intent: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };
    case 'REHYDRATE_ONBOARDING':
      return { ...state, ...action.payload };
    case 'RESET':
      return onboardingInitialState;
    default:
      return state;
  }
}
