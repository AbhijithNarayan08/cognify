import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { onboardingService } from '../services/firebase/onboarding.service';

export function useOnboarding() {
  const { state, dispatch } = useApp();
  const uid = state.user?.uid;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Finalizes the onboarding flow, writes demographics profile and focus intent to Firestore,
   * and dispatches the transition action to the main dashboard navigation.
   * @param {string} intent Selected focus area
   * @param {object} profile Profile details (firstName, ageRange, avgSleepBucket, activityLevel)
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  const completeOnboardingFlow = async (intent, profile) => {
    if (!uid) {
      return { success: false, error: "Authentication required to complete onboarding" };
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Persist intent and profile values directly in Firestore users collection
      const result = await onboardingService.saveOnboardingState(uid, intent, profile);
      if (!result.success) throw new Error(result.error);

      // 2. Dispatch onboarding state complete globally
      dispatch({
        type: 'COMPLETE_ONBOARDING',
        payload: {
          cognitiveScore: 680 // Initialize default baseline cognitive baseline score
        }
      });

      setSaving(false);
      return { success: true };
    } catch (err) {
      console.error("❌ [useOnboarding.completeOnboardingFlow] Failed:", err);
      setError(err.message);
      setSaving(false);
      return { success: false, error: err.message };
    }
  };

  return {
    saving,
    error,
    onboardingComplete: state.onboardingComplete,
    completeOnboardingFlow
  };
}
