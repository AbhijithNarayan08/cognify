// src/features/train/games/SignalChain/useSignalChainEngine.js
import { useState, useRef, useCallback } from 'react';
import { SIGNAL_CHAIN } from '../../../../constants/gameConfig';

export function useSignalChainEngine({ level, multiplier, onRoundComplete }) {
  const [sequence, setSequence] = useState([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState(null);
  const [userClicks, setUserClicks] = useState([]);
  const [phase, setPhase] = useState('watching'); // 'watching' | 'recall' | 'feedback' | 'between_rounds'
  const [roundNumber, setRoundNumber] = useState(1);
  const [sessionScores, setSessionScores] = useState([]);
  const [levelHistory, setLevelHistory] = useState([level]);
  const [bestSequence, setBestSequence] = useState(0);
  const [feedbackColor, setFeedbackColor] = useState(null); // 'green' | 'orange' | null
  const [timeoutProgress, setTimeoutProgress] = useState(1.0); // 1.0 to 0.0

  const roundStartTimeRef = useRef(0);
  const timeoutsRef = useRef([]);

  const config = SIGNAL_CHAIN.levels[level] || SIGNAL_CHAIN.levels[1];

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const calculateSignalChainRoundScore = useCallback(({
    nodesCorrect,
    sequenceLength,
    recallTimeMs,
    responseWindow,
    tier,
    multiplier,
  }) => {
    const POINTS_PER_NODE = SIGNAL_CHAIN.POINTS_PER_NODE || 10;
    const TIER_MULTIPLIERS = SIGNAL_CHAIN.TIER_MULTIPLIERS || { easy: 1.0, medium: 1.5, hard: 2.0 };
    const tierMultiplier = TIER_MULTIPLIERS[tier] || 1.0;

    const baseScore = nodesCorrect * POINTS_PER_NODE * tierMultiplier;

    const completionBonus = (nodesCorrect === sequenceLength)
      ? POINTS_PER_NODE * tierMultiplier
      : 0;

    const speedBonus = (nodesCorrect === sequenceLength && recallTimeMs < responseWindow * 0.5)
      ? Math.round(POINTS_PER_NODE * tierMultiplier)
      : 0;

    const rawScore = baseScore + completionBonus + speedBonus;
    const finalScore = Math.round(rawScore * multiplier);

    return finalScore;
  }, []);

  return {
    sequence,
    setSequence,
    activeNodeIndex,
    setActiveNodeIndex,
    userClicks,
    setUserClicks,
    phase,
    setPhase,
    roundNumber,
    setRoundNumber,
    sessionScores,
    setSessionScores,
    levelHistory,
    setLevelHistory,
    bestSequence,
    setBestSequence,
    feedbackColor,
    setFeedbackColor,
    timeoutProgress,
    setTimeoutProgress,
    roundStartTimeRef,
    timeoutsRef,
    clearAllTimers,
    calculateSignalChainRoundScore,
    config,
  };
}
