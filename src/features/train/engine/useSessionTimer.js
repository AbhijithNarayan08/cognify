// src/features/train/engine/useSessionTimer.js
import { useState, useEffect, useRef } from 'react';
import { SESSION_DURATION_MS, SESSION_RESULT } from '../../../constants/gameConfig';

export function useSessionTimer() {
  const [activeTimeElapsed, setActiveTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);

  const lastTickRef = useRef(null);

  const isComplete = activeTimeElapsed >= SESSION_DURATION_MS;

  useEffect(() => {
    let intervalId = null;

    if (isActive && !isComplete) {
      lastTickRef.current = Date.now();
      intervalId = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        setActiveTimeElapsed((prev) => {
          const next = prev + delta;
          if (next >= SESSION_DURATION_MS) {
            setIsActive(false);
            return SESSION_DURATION_MS;
          }
          return next;
        });
      }, 50);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, isComplete]);

  const pause = () => {
    if (isComplete) return false;
    if (pauseCount >= SESSION_RESULT.MAX_PAUSES) {
      // Ignore pause gesture silently
      return false;
    }
    setIsActive(false);
    setPauseCount((prev) => prev + 1);
    return true;
  };

  const resume = () => {
    if (isComplete) return;
    setIsActive(true);
  };

  const reset = () => {
    setActiveTimeElapsed(0);
    setIsActive(false);
    setPauseCount(0);
  };

  return {
    activeTimeElapsed,
    isActive,
    isComplete,
    pauseCount,
    pause,
    resume,
    reset,
    setIsActive,
  };
}
