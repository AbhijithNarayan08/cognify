// src/features/train/games/FlashSort/index.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, AccessibilityInfo, Animated } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFlashSortEngine } from './useFlashSortEngine';
import FlashSortFixation from './FlashSortFixation';
import FlashSortShape from './FlashSortShape';
import FlashSortTapZones from './FlashSortTapZones';
import FlashSortFeedback from './FlashSortFeedback';
import { Spacing, Typography } from '../../../../theme';
import { FLASH_SORT } from '../../../../constants/gameConfig';
import { GameHaptics } from '../../../../utils/haptics';
import { t } from '../../../../constants/useStrings';

const { width: screenWidth } = Dimensions.get('window');

export default function FlashSort({ level, isActive, onRoundComplete, Colors, multiplier = 1.0, streakCount = 0 }) {
  const engine = useFlashSortEngine({ level, multiplier, onRoundComplete });
  
  const {
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
    clearAllTimers,
    calculateFlashSortRoundScore,
    config,
    timeoutsRef,
  } = engine;

  const [showTapZoneTutorial, setShowTapZoneTutorial] = useState(false);
  const [tutorialRoundCount, setTutorialRoundCount] = useState(0);
  const [levelChange, setLevelChange] = useState(null); // 'up' | 'down' | null

  // UX additions
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const [feedbackType, setFeedbackType] = useState(null); // 'correct' | 'incorrect'
  const ghostOpacity = useRef(new Animated.Value(0)).current;
  const [lastReactionTime, setLastReactionTime] = useState(null);
  const [opticalOffset, setOpticalOffset] = useState(0);
  const entranceAnim = useRef(new Animated.Value(0)).current; // fade+scale on shape entrance

  const prevLevelRef = useRef(level);
  const isActiveRef = useRef(isActive);
  const hasRespondedRef = useRef(false);

  // Sync active status ref
  useEffect(() => {
    isActiveRef.current = isActive;
    if (!isActive) {
      clearAllTimers();
    } else {
      if (roundData.length === 0 && roundPhase === 'fixation' && timeoutsRef.current.length === 0) {
        startRoundFlow();
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

  // Load first-visit tap zones tutorial state
  useEffect(() => {
    AsyncStorage.getItem('cognify:tutorial:flashSort:tapZones').then((val) => {
      if (!val) {
        setShowTapZoneTutorial(true);
      }
    });

    return () => clearAllTimers();
  }, [clearAllTimers]);

  const startRoundFlow = () => {
    if (!isActiveRef.current) return;
    clearAllTimers();
    hasRespondedRef.current = false;
    setRoundPhase('fixation');
    setFeedbackStatus(null);

    // Fixation Phase (200ms, non-negotiable)
    const fixationTimeout = setTimeout(() => {
      if (!isActiveRef.current) return;
      showStimulus();
    }, FLASH_SORT.FIXATION_DURATION_MS || 200);

    timeoutsRef.current.push(fixationTimeout);
  };

  const showStimulus = () => {
    const shape = Math.random() > 0.5 ? 'circle' : 'square';
    setCurrentShape(shape);

    // Distractor color pool
    let chosenColor = Colors.domain?.speed?.main || '#FFC000';
    if (config.distractorType === 'colour' || config.distractorType === 'pattern_colour' || config.distractorType === 'high_similarity') {
      const colors = FLASH_SORT.DISTRACTOR_COLOURS || ['#FFC000', '#0073E6', '#3DAB7F', '#D85A30'];
      chosenColor = colors[Math.floor(Math.random() * colors.length)];
    }
    setShapeColor(chosenColor);

    // Reset entrance animation, then start it
    entranceAnim.setValue(0);
    setRoundPhase('stimulus');
    engine.stimulusTimestampRef.current = Date.now();

    // Fade + scale in over 80ms
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();

    // Accessibility shape announcement
    AccessibilityInfo.announceForAccessibility(shape);

    // Response window limit
    const limitTimeout = setTimeout(() => {
      if (!isActiveRef.current || hasRespondedRef.current) return;
      handleResponse(null, Date.now()); // Miss
    }, config.stimulusDuration);

    timeoutsRef.current.push(limitTimeout);
  };

  const handleResponse = (selectedSide, responseTime) => {
    if (hasRespondedRef.current) return;
    hasRespondedRef.current = true;

    clearAllTimers();

    const stimulusTime = engine.stimulusTimestampRef.current;
    const reactionTimeMs = selectedSide ? (responseTime - stimulusTime) : null;
    const isFalseStart = reactionTimeMs !== null && reactionTimeMs < (FLASH_SORT.ANTICIPATORY_THRESHOLD_MS || 100);

    const expectedSide = currentShape === 'circle' ? 'left' : 'right';
    const isCorrect = selectedSide === expectedSide;

    let status = 'too_slow';
    if (isFalseStart) {
      status = 'false_start';
    } else if (selectedSide) {
      status = isCorrect ? 'correct' : 'incorrect';
    }

    setFeedbackStatus(status);
    setRoundPhase('feedback');

    // Trigger screen-level feedback pulse
    setFeedbackType(status === 'correct' ? 'correct' : 'incorrect');
    Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    // Trigger reaction time ghost if correct
    if (status === 'correct') {
      setLastReactionTime(reactionTimeMs);
      Animated.timing(ghostOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      ghostOpacity.setValue(0);
      setLastReactionTime(null);
    }

    // Run scoring algorithms
    const { score } = calculateFlashSortRoundScore({
      isCorrect,
      isFalseStart,
      reactionTimeMs,
      stimulusDuration: config.stimulusDuration,
      tier: config.tier,
      multiplier,
      hasConsistencyBonus: lastRoundWasCorrect && isCorrect && !isFalseStart,
    });

    // Update consistency flag
    if (isFalseStart) {
      // False start is neutral - keeps consistency unchanged
    } else {
      setLastRoundWasCorrect(isCorrect && status === 'correct');
    }

    // Accrue round record
    const record = {
      roundNumber: roundData.length + 1,
      level,
      tier: config.tier,
      shape: currentShape,
      response: selectedSide ? (selectedSide === 'left' ? 'circle' : 'square') : null,
      isCorrect: isCorrect && !isFalseStart && selectedSide !== null,
      isFalseStart,
      reactionTimeMs,
      score,
      distractorType: config.distractorType,
    };

    const nextRoundData = [...roundData, record];
    setRoundData(nextRoundData);

    // Play feedback haptics
    if (status === 'correct') {
      GameHaptics.correct();
    } else if (status === 'incorrect' || status === 'too_slow') {
      GameHaptics.incorrect();
    } // false start has no error haptic per spec

    // Calculate accuracy percentage (excluding false starts)
    const nonFalseStarts = nextRoundData.filter(r => !r.isFalseStart);
    const correctCount = nonFalseStarts.filter(r => r.isCorrect).length;
    const computedAccuracy = nonFalseStarts.length > 0 ? Math.round((correctCount / nonFalseStarts.length) * 100) : 0;

    // Resolve valid reaction times for mean/fastest metrics
    const validRTs = nextRoundData
      .filter(r => r.isCorrect && !r.isFalseStart && r.reactionTimeMs !== null)
      .map(r => r.reactionTimeMs);

    const meanReactionTime = validRTs.length > 0
      ? Math.round(validRTs.reduce((a, b) => a + b, 0) / validRTs.length)
      : 0;

    const fastestRT = validRTs.length > 0
      ? Math.min(...validRTs)
      : 0;

    // Invoke shared callback
    onRoundComplete({
      isCorrect: isCorrect && !isFalseStart && selectedSide !== null,
      scoreProps: {
        baseScore: score,
        speedBonus: 0,
        maxScore: 9999, // Uncapped raw score
      },
      metrics: {
        reactionTimeMs: reactionTimeMs || 0,
        isAnticipatory: isFalseStart,
        meanReactionTime,
        fastestRT,
        bestSequence: fastestRT, // fallback mapping
        difficultyTier: config.tier,
        roundsCompleted: nextRoundData.length,
        accuracy: computedAccuracy,
      },
    });

    // Handle tap zone tutorial countdown
    if (showTapZoneTutorial) {
      const nextTutorialCount = tutorialRoundCount + 1;
      setTutorialRoundCount(nextTutorialCount);
      if (nextTutorialCount >= 3) {
        setShowTapZoneTutorial(false);
        AsyncStorage.setItem('cognify:tutorial:flashSort:tapZones', 'true');
      }
    }

    // Feedback duration (300ms)
    const feedbackTimeout = setTimeout(() => {
      if (!isActiveRef.current) return;
      
      setRoundPhase('isi');

      // Fade out reaction time ghost before next stimulus appears
      Animated.timing(ghostOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Inter-Stimulus Interval (ISI) pause (200ms–600ms dead time)
      const isiTimeout = setTimeout(() => {
        setLevelChange(null);
        startRoundFlow();
      }, config.ISI);

      timeoutsRef.current.push(isiTimeout);
    }, FLASH_SORT.FEEDBACK_DURATION_MS || 300);

    timeoutsRef.current.push(feedbackTimeout);
  };

  // Per-side feedback tint: only flash the side that was tapped
  const leftZoneTint = feedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'transparent',
      feedbackType === 'correct' ? 'rgba(61,171,127,0.07)' : 'rgba(226,75,74,0.07)',
    ],
  });
  const rightZoneTint = feedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'transparent',
      feedbackType === 'correct' ? 'rgba(61,171,127,0.07)' : 'rgba(226,75,74,0.07)',
    ],
  });

  const hintColor = level <= 1
    ? (Colors.textTertiary || '#8E8A86')
    : (Colors.domain?.speed?.main || '#FFC000');

  return (
    <View style={[styles.container, { backgroundColor: Colors.appBg }]}>
      {/* Full-screen Left/Right Tap Zones */}
      <FlashSortTapZones
        isActive={roundPhase === 'stimulus'}
        onResponse={(side, time) => handleResponse(side, time)}
      />

      {/* ── SPLIT PANEL BACKGROUND ────────────────────────────── */}
      <View style={styles.splitRow} pointerEvents="none">
        {/* LEFT — circle */}
        <Animated.View style={[styles.zonePanel, styles.zonePanelLeft, { backgroundColor: leftZoneTint }]}>
          {/* Circle hint anchored to bottom-left */}
          <View style={styles.hintBottomLeft}>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Circle cx={9} cy={9} r={8} fill={hintColor} opacity={0.9} />
            </Svg>
            <Text style={[styles.hintLabel, { color: hintColor }]}>{t('train.flashSort.circle')}</Text>
          </View>
        </Animated.View>

        {/* Centre divider */}
        <View style={styles.divider} pointerEvents="none" />

        {/* RIGHT — square */}
        <Animated.View style={[styles.zonePanel, styles.zonePanelRight, { backgroundColor: rightZoneTint }]}>
          {/* Square hint anchored to bottom-right */}
          <View style={styles.hintBottomRight}>
            <Text style={[styles.hintLabel, { color: hintColor }]}>{t('train.flashSort.square')}</Text>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Rect x={1} y={1} width={16} height={16} rx={3} ry={3} fill={hintColor} opacity={0.9} />
            </Svg>
          </View>
        </Animated.View>
      </View>

      {/* Top zone: round counter + streak — sits above split panels */}
      <View style={styles.topZone} pointerEvents="none">
        <Text style={[styles.roundText, { color: Colors.textSecondary }]}>
          {t('train.flashSort.round', { count: roundData.length + 1 })}
        </Text>
        {streakCount > 0 && (
          <Text style={[styles.streakText, { color: '#FFC000' }]}>
            {t('train.flashSort.correctStreak', { count: streakCount })}
          </Text>
        )}
      </View>

      {/* Level difficulty changes notifications shown during ISI */}
      {roundPhase === 'isi' && levelChange && (
        <View style={styles.levelChangeOverlay}>
          <Text style={[
            styles.levelChangeText,
            levelChange === 'up' ? { color: '#3DC27A' } : { color: Colors.textTertiary }
          ]}>
            {level === 5 && levelChange === 'up' 
              ? t('train.flashSort.hardMode') 
              : (levelChange === 'up' ? t('train.flashSort.distractorsIncreasing') : t('train.flashSort.adjustingDifficulty'))}
          </Text>
        </View>
      )}

      {/* Main Stimulus Content Area — centred over both zones */}
      <View
        style={styles.stimulusLayer}
        pointerEvents="none"
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          setOpticalOffset(height * 0.05);
        }}
      >
        <View style={{ transform: [{ translateY: -opticalOffset }], width: 80, height: 80, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {roundPhase === 'fixation' && (
            <FlashSortFixation Colors={Colors} />
          )}

          {roundPhase === 'stimulus' && (
            <Animated.View style={{
              opacity: entranceAnim,
              transform: [{ scale: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            }}>
              <FlashSortShape
                shapeType={currentShape}
                distractorType={config.distractorType}
                color={shapeColor}
                Colors={Colors}
              />
            </Animated.View>
          )}

          {roundPhase === 'feedback' && (
            <FlashSortFeedback
              status={feedbackStatus}
              shapeType={currentShape}
              distractorType={config.distractorType}
              color={shapeColor}
              Colors={Colors}
            />
          )}

          {lastReactionTime !== null && (roundPhase === 'feedback' || roundPhase === 'isi') && (
            <Animated.View style={[styles.ghostContainer, { opacity: ghostOpacity }]}>
              <Text style={[styles.ghostText, { color: Colors.textTertiary }]}>
                {t('train.flashSort.reactionTime', { rt: lastReactionTime })}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  // Split screen panels
  splitRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  zonePanel: {
    flex: 1,
    height: '100%',
  },
  zonePanelLeft: {
    borderRightWidth: 0,
    paddingBottom: Spacing[12],
    paddingLeft: Spacing[5],
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  zonePanelRight: {
    paddingBottom: Spacing[12],
    paddingRight: Spacing[5],
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  // Hint labels pinned to bottom corners of each zone
  hintBottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintBottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
  },

  // Stimulus layer floats above the split panels
  stimulusLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Top info zone
  topZone: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  roundText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
  },
  streakText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    marginTop: 4,
  },

  // Ghost reaction time shown below shape
  ghostContainer: {
    position: 'absolute',
    top: 100,
    alignItems: 'center',
    width: 200,
  },
  ghostText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
  },

  // Level change notification
  levelChangeOverlay: {
    position: 'absolute',
    top: Spacing[6],
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  levelChangeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    textAlign: 'center',
  },

  // Unused legacy styles kept for safety
  playCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stimulusWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
});
