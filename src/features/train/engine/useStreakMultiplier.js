// src/features/train/engine/useStreakMultiplier.js
import { useState } from 'react';
import { STREAK_MULTIPLIERS } from '../../../constants/gameConfig';

export function useStreakMultiplier() {
  const [streakCount, setStreakCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);

  const getMultiplierForStreak = (streak) => {
    if (streak >= 10) return STREAK_MULTIPLIERS[10] || 1.5;
    if (streak >= 6) return STREAK_MULTIPLIERS[6] || 1.25;
    if (streak >= 3) return STREAK_MULTIPLIERS[3] || 1.1;
    return 1.0;
  };

  const recordCorrect = () => {
    setStreakCount((prev) => {
      const nextStreak = prev + 1;
      setMultiplier(getMultiplierForStreak(nextStreak));
      return nextStreak;
    });
  };

  const recordMiss = () => {
    setStreakCount(0);
    setMultiplier(1.0);
  };

  const reset = () => {
    setStreakCount(0);
    setMultiplier(1.0);
  };

  return {
    streakCount,
    multiplier,
    recordCorrect,
    recordMiss,
    reset,
  };
}
