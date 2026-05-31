import { analytics } from '../../services/analyticsService';

// Onboarding
export const setIntent = (id) => ({ type: 'SET_INTENT', payload: id });
export const setProfile = (profileData) => ({ type: 'SET_PROFILE', payload: profileData });

export const completeAssessment = (results) => {
  analytics.track('assessment_completed', results);
  return { type: 'COMPLETE_ASSESSMENT', payload: results };
};

export const completeOnboarding = (cognitiveScore) => {
  analytics.track('onboarding_completed', { cognitiveScore });
  return { type: 'COMPLETE_ONBOARDING', payload: { cognitiveScore } };
};

export const resetApp = () => {
  analytics.track('app_reset');
  return { type: 'RESET' };
};

// Session
export const startWorkout = () => {
  analytics.track('workout_started');
  return { type: 'START_WORKOUT' };
};

export const completeWorkout = (payload) => {
  analytics.track('workout_completed', payload);
  return { type: 'COMPLETE_WORKOUT', payload };
};

export const setCheckin = (key, value) => {
  analytics.track('checkin_completed', { type: key, value });
  return { type: 'SET_CHECKIN', key, value };
};
