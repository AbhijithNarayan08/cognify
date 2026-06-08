/**
 * useCheckins — manages daily lifestyle check-in state.
 * Tracks which check-ins are pending and handles dismiss + submit.
 */
import { useState, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { setCheckin } from '../../../store/actions';

const CHECKIN_TYPES = ['sleep', 'activity', 'mood'];

export function useCheckins() {
  const { state, dispatch } = useApp();
  const [dismissed, setDismissed] = useState([]);

  const pendingCheckins = CHECKIN_TYPES.filter(type => {
    // 1. If already completed today, filter out
    if (state.checkins[type] !== null) return false;
    
    // 2. If dismissed within the last 6 hours, filter out
    const dismissedAt = state.checkinDismissedAt?.[type];
    if (dismissedAt && Date.now() - dismissedAt < 6 * 60 * 60 * 1000) {
      return false;
    }
    
    // 3. Local dismiss safeguard
    if (dismissed.includes(type)) return false;
    
    return true;
  });

  const handleComplete = useCallback((type, value) => {
    dispatch(setCheckin(type, value));
  }, [dispatch]);

  const handleDismiss = useCallback((type) => {
    setDismissed(prev => [...prev, type]);
    dispatch({ type: 'DISMISS_CHECKIN', key: type });
  }, [dispatch]);

  return { pendingCheckins, handleComplete, handleDismiss };
}
