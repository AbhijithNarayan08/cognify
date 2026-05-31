// src/features/train/games/FlashSort/useFlashSortEngine.js
import { useState, useRef, useCallback } from 'react';
import { FLASH_SORT } from '../../../../constants/gameConfig';

export function useFlashSortEngine({ level, multiplier, onRoundComplete }) {
  const [roundPhase, setRoundPhase] = useState('fixation'); // 'fixation' | 'stimulus' | 'feedback' | 'isi'
  const [currentShape, setCurrentShape] = useState('circle'); // 'circle' | 'square'
  const [shapeColor, setShapeColor] = useState('#FFC000');
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'correct' | 'incorrect' | 'too_slow' | 'false_start' | null
  const [roundData, setRoundData] = useState([]);
  const [lastRoundWasCorrect, setLastRoundWasCorrect] = useState(false);
  const [sessionScores, setSessionScores] = useState([]);

  const stimulusTimestampRef = useRef(0);
  const timeoutsRef = useRef([]);

  const config = FLASH_SORT.levels[level] || FLASH_SORT.levels[1];

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const calculateFlashSortRoundScore = useCallback(({
    isCorrect,
    isFalseStart,
    reactionTimeMs,
    stimulusDuration,
    tier,
    multiplier,
    hasConsistencyBonus,
  }) => {
    if (isFalseStart) return { score: 0, isFalseStart: true };
    if (!isCorrect || reactionTimeMs === null) return { score: 0, isFalseStart: false };

    const TIER_MULTIPLIERS = FLASH_SORT.TIER_MULTIPLIERS || { easy: 1.0, medium: 1.5, hard: 2.25 };
    const tierMultiplier = TIER_MULTIPLIERS[tier] || 1.0;

    const speedRatio = 1 - (reactionTimeMs / stimulusDuration);
    const baseScore = Math.max(0, Math.round(speedRatio * 100));

    const eliteBonus = reactionTimeMs < stimulusDuration * 0.20 ? 20 : 0;
    const consistencyBonus = hasConsistencyBonus ? 10 : 0;

    const rawScore = baseScore + eliteBonus + consistencyBonus;
    const tieredScore = Math.round(rawScore * tierMultiplier);
    const finalScore = Math.round(tieredScore * multiplier);

    return { score: finalScore, isFalseStart: false };
  }, []);

  return {
    roundPhase,
    setRoundPhase,
    currentShape,
    setCurrentShape,
    shapeColor,
    setShapeColor,
    feedbackStatus,
    setFeedbackStatus,
    roundData,
    setRoundData,
    lastRoundWasCorrect,
    setLastRoundWasCorrect,
    sessionScores,
    setSessionScores,
    stimulusTimestampRef,
    timeoutsRef,
    clearAllTimers,
    calculateFlashSortRoundScore,
    config,
  };
}
