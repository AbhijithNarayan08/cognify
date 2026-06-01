// src/features/train/games/SignalChain/index.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import { useSignalChainEngine } from './useSignalChainEngine';
import SignalChainGrid from './SignalChainGrid';
import RoundIndicator from './RoundIndicator';
import ResponseWindowBar from './ResponseWindowBar';
import SignalChainFeedback from './SignalChainFeedback';
import { Spacing, Typography } from '../../../../theme';
import { SIGNAL_CHAIN } from '../../../../constants/gameConfig';
import { GameHaptics } from '../../../../utils/haptics';

const { width: screenWidth } = Dimensions.get('window');

export default function SignalChain({ level, isActive, onRoundComplete, Colors, multiplier = 1.0 }) {
  const engine = useSignalChainEngine({ level, multiplier, onRoundComplete });
  const {
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
    feedbackColor,
    setFeedbackColor,
    timeoutProgress,
    setTimeoutProgress,
    roundStartTimeRef,
    timeoutsRef,
    clearAllTimers,
    calculateSignalChainRoundScore,
    config,
  } = engine;

  const [lastCorrectTapIndex, setLastCorrectTapIndex] = useState(null);
  const [showScoreFeedback, setShowScoreFeedback] = useState(false);
  const [lastRoundScore, setLastRoundScore] = useState(0);
  const [levelChange, setLevelChange] = useState(null); // 'up' | 'down' | null
  const [isTimeoutMiss, setIsTimeoutMiss] = useState(false);

  const prevLevelRef = useRef(level);
  const isActiveRef = useRef(isActive);

  // Sync active status ref
  useEffect(() => {
    isActiveRef.current = isActive;
    if (!isActive) {
      clearAllTimers();
      setActiveNodeIndex(null);
    } else {
      if (sequence.length === 0) {
        startNewRound();
      }
    }
  }, [isActive]);

  // Track level change for adaptive difficulty notifications
  useEffect(() => {
    if (prevLevelRef.current !== level) {
      if (level > prevLevelRef.current) {
        setLevelChange('up');
      } else if (level < prevLevelRef.current) {
        setLevelChange('down');
      }
      prevLevelRef.current = level;
    }
  }, [level]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Grid size dimensions based on level
  const gridDim = useMemo(() => {
    const sizeStr = config.gridSize; // '3x3' | '4x4' | '5x5'
    let dim = parseInt(sizeStr.split('x')[0], 10);
    // iPhone SE screen width boundary is 320pt
    if (screenWidth <= 320 && dim > 4) {
      return 4;
    }
    return dim;
  }, [config.gridSize]);

  // Compute node size horizontally
  const nodeSize = useMemo(() => {
    const horizontalPadding = Spacing[5] * 2; // 20pt each side
    const gap = 8;
    const computed = (screenWidth - horizontalPadding - (gridDim - 1) * gap) / gridDim;
    return Math.max(computed, 44);
  }, [gridDim]);

  const startNewRound = () => {
    clearAllTimers();
    setActiveNodeIndex(null);
    setUserClicks([]);
    setFeedbackColor(null);
    setIsTimeoutMiss(false);
    setShowScoreFeedback(false);
    setPhase('watching');

    const totalNodes = gridDim * gridDim;
    const nextSeq = [];
    for (let i = 0; i < config.sequenceLength; i++) {
      let randNode = Math.floor(Math.random() * totalNodes);
      // Avoid consecutive duplicate nodes
      while (nextSeq.length > 0 && randNode === nextSeq[nextSeq.length - 1]) {
        randNode = Math.floor(Math.random() * totalNodes);
      }
      nextSeq.push(randNode);
    }
    setSequence(nextSeq);
    playSequence(nextSeq);
  };

  const playSequence = (seq) => {
    clearAllTimers();
    const { displayDuration } = config;
    const stepDuration = displayDuration + 300; // constant gap of 300ms

    seq.forEach((nodeIdx, i) => {
      // Light up node
      const onTimeout = setTimeout(() => {
        if (!isActiveRef.current) return;
        setActiveNodeIndex(nodeIdx);
        // Accessibility announcement
        const row = Math.floor(nodeIdx / gridDim) + 1;
        const col = (nodeIdx % gridDim) + 1;
        AccessibilityInfo.announceForAccessibility(`node ${row} ${col}`);
      }, i * stepDuration);

      // Turn off node
      const offTimeout = setTimeout(() => {
        if (!isActiveRef.current) return;
        setActiveNodeIndex(null);

        // Transition to recall state after 200ms perceptual beat
        if (i === seq.length - 1) {
          const recallTimeout = setTimeout(() => {
            if (!isActiveRef.current) return;
            setPhase('recall');
            roundStartTimeRef.current = Date.now();
            startResponseWindowTimer(config.responseWindow);
            AccessibilityInfo.announceForAccessibility(`recall ${seq.length} nodes starting now`);
          }, 200);
          timeoutsRef.current.push(recallTimeout);
        }
      }, i * stepDuration + displayDuration);

      timeoutsRef.current.push(onTimeout, offTimeout);
    });
  };

  // Response Window Timer & Draining Progress Bar
  const responseWindowTimerRef = useRef(null);
  const remainingTimeRef = useRef(0);

  const startResponseWindowTimer = (duration) => {
    if (responseWindowTimerRef.current) clearInterval(responseWindowTimerRef.current);
    remainingTimeRef.current = duration;
    setTimeoutProgress(1.0);

    let lastTick = Date.now();
    responseWindowTimerRef.current = setInterval(() => {
      if (!isActiveRef.current) {
        lastTick = Date.now();
        return;
      }
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;

      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - delta);
      const progress = remainingTimeRef.current / duration;
      setTimeoutProgress(progress);

      if (remainingTimeRef.current <= 0) {
        clearInterval(responseWindowTimerRef.current);
        handleTimeout();
      }
    }, 50);
  };

  const handleTimeout = () => {
    setPhase('feedback');
    setIsTimeoutMiss(true);
    playFeedbackAnimation(false, userClicks.length);
  };

  const handleNodeTap = (nodeIdx) => {
    if (phase !== 'recall' || !isActive) return;

    const currentStep = userClicks.length;
    const expected = sequence[currentStep];

    if (nodeIdx === expected) {
      const nextClicks = [...userClicks, nodeIdx];
      setUserClicks(nextClicks);

      // Tactile click floating animation
      setLastCorrectTapIndex(nodeIdx);
      const pulseOffTimeout = setTimeout(() => {
        setLastCorrectTapIndex(null);
      }, 100);
      timeoutsRef.current.push(pulseOffTimeout);

      GameHaptics.correct();

      if (nextClicks.length === sequence.length) {
        if (responseWindowTimerRef.current) clearInterval(responseWindowTimerRef.current);
        setPhase('feedback');
        playFeedbackAnimation(true, nextClicks.length);
      }
    } else {
      // Wrong tap or double tap - end round immediately
      if (responseWindowTimerRef.current) clearInterval(responseWindowTimerRef.current);
      setPhase('feedback');
      playFeedbackAnimation(false, userClicks.length);
    }
  };

  const playFeedbackAnimation = (isSuccess, nodesCorrect) => {
    clearAllTimers();
    setActiveNodeIndex(null);
    setFeedbackColor(isSuccess ? '#3DC27A' : '#F4A041');

    const recallTimeMs = Date.now() - roundStartTimeRef.current;
    const POINTS_PER_NODE = SIGNAL_CHAIN.POINTS_PER_NODE || 10;
    const TIER_MULTIPLIERS = SIGNAL_CHAIN.TIER_MULTIPLIERS || { easy: 1.0, medium: 1.5, hard: 2.0 };
    const tierMultiplier = TIER_MULTIPLIERS[config.tier] || 1.0;

    // Calculate score
    const roundScore = calculateSignalChainRoundScore({
      nodesCorrect,
      sequenceLength: sequence.length,
      recallTimeMs,
      responseWindow: config.responseWindow,
      tier: config.tier,
      multiplier,
    });

    setLastRoundScore(roundScore);
    setShowScoreFeedback(isSuccess && roundScore > 0);

    if (isSuccess) {
      GameHaptics.correct();
    } else {
      GameHaptics.incorrect();
    }

    // Replay sequence highlights
    const interval = SIGNAL_CHAIN.FEEDBACK_INTERVAL_MS || 80;
    sequence.forEach((nodeIdx, i) => {
      const flashOn = setTimeout(() => {
        if (!isActiveRef.current) return;
        setActiveNodeIndex(nodeIdx);
      }, i * interval);

      const flashOff = setTimeout(() => {
        if (!isActiveRef.current) return;
        setActiveNodeIndex(null);

        // Transition to STATE 6 (Between Rounds)
        if (i === sequence.length - 1) {
          const toBetweenRoundsTimeout = setTimeout(() => {
            if (!isActiveRef.current) return;
            
            // Invoke shared callback with metrics payload
            onRoundComplete({
              isCorrect: isSuccess && nodesCorrect === sequence.length,
              scoreProps: {
                baseScore: nodesCorrect * POINTS_PER_NODE * tierMultiplier,
                speedBonus: isSuccess && recallTimeMs < (config.responseWindow * 0.5) ? POINTS_PER_NODE * tierMultiplier : 0,
                maxScore: 9999, // Uncapped raw score
              },
              metrics: {
                nodesCorrect,
                sequenceLength: sequence.length,
                tier: config.tier,
                roundScore,
                bestSequence: isSuccess && sequence.length > engine.bestSequence ? sequence.length : engine.bestSequence,
              },
            });

            // Start between rounds pause (400ms)
            setPhase('between_rounds');
            setRoundNumber((prev) => prev + 1);

            const startNextTimeout = setTimeout(() => {
              setLevelChange(null);
              startNewRound();
            }, 400);
            timeoutsRef.current.push(startNextTimeout);

          }, 100);
          timeoutsRef.current.push(toBetweenRoundsTimeout);
        }
      }, i * interval + 120);

      timeoutsRef.current.push(flashOn, flashOff);
    });
  };

  // Node Points value for floating tactile tap indicator
  const POINTS_PER_NODE = SIGNAL_CHAIN.POINTS_PER_NODE || 10;
  const TIER_MULTIPLIERS = SIGNAL_CHAIN.TIER_MULTIPLIERS || { easy: 1.0, medium: 1.5, hard: 2.0 };
  const nodePoints = Math.round(POINTS_PER_NODE * (TIER_MULTIPLIERS[config.tier] || 1.0));

  return (
    <View style={styles.container}>
      {/* Round & Node metrics */}
      <View style={styles.metricsContainer}>
        <RoundIndicator
          roundNumber={roundNumber}
          sequenceLength={sequence.length}
          Colors={Colors}
        />
        {levelChange && (
          <Text style={[
            styles.levelChangeText,
            levelChange === 'up' ? { color: '#3DC27A' } : { color: Colors.textTertiary }
          ]}>
            {levelChange === 'up' ? '▲ level up' : 'adjusting difficulty'}
          </Text>
        )}
      </View>

      {/* Grid container */}
      <View style={styles.gridContainer}>
        <SignalChainGrid
          gridDim={gridDim}
          nodeSize={nodeSize}
          activeNodeIndex={activeNodeIndex}
          phase={phase}
          onNodeTap={handleNodeTap}
          feedbackColor={feedbackColor}
          Colors={Colors}
          disabled={phase !== 'recall' || !isActive}
          nodePoints={nodePoints}
          lastCorrectTapIndex={lastCorrectTapIndex}
        />

        {/* Floating feedback score delta */}
        <SignalChainFeedback
          scoreDelta={lastRoundScore}
          visible={showScoreFeedback && phase === 'feedback'}
          Colors={Colors}
        />
      </View>

      {/* Bottom status and responses */}
      <View style={styles.bottomArea}>
        {phase === 'recall' && (
          <>
            <ResponseWindowBar progress={timeoutProgress} Colors={Colors} />
            <Text style={[styles.caption, { color: Colors.textTertiary }]}>
              {userClicks.length} of {sequence.length} tapped
            </Text>
          </>
        )}

        {phase === 'feedback' && isTimeoutMiss && (
          <Text style={[styles.caption, { color: Colors.textTertiary, marginTop: Spacing[4] }]}>
            too slow
          </Text>
        )}

        {/* Help labels shown dynamically based on round progress */}
        {phase === 'watching' && roundNumber <= 3 && (
          <Text style={[styles.caption, { color: Colors.textTertiary }]}>
            watch carefully.
          </Text>
        )}
        {phase === 'recall' && roundNumber <= 5 && (
          <Text style={[styles.caption, { color: Colors.brandPrimary || '#F4A041' }]}>
            tap the sequence.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  metricsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  levelChangeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    marginTop: 2,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: Spacing[6],
    height: 60,
  },
  caption: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    textAlign: 'center',
  },
});
