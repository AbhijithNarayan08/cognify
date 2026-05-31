// src/features/train/screens/ActiveSessionScreen.js
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, StatusBar, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pause, Play, Clock, BarChart2, X } from 'lucide-react-native';

import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../../theme';
import { useApp } from '../../../context/AppContext';
import { completeWorkout } from '../../../store/actions';
import { t } from '../../../constants/useStrings';
import { GameHaptics } from '../../../utils/haptics';

// Shared Engine Hooks & Components
import { useSessionTimer } from '../engine/useSessionTimer';
import { useAdaptiveLadder } from '../engine/useAdaptiveLadder';
import { useStreakMultiplier } from '../engine/useStreakMultiplier';
import { calculateRoundScore, normaliseSessionScore, normaliseFlashSortSessionScore } from '../engine/scoring';

import SessionTimerBar from '../components/SessionTimerBar';
import StreakBadge from '../components/StreakBadge';
import ScoreDisplay from '../components/ScoreDisplay';
import { exerciseService } from '../../../services/exerciseService';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

// Dynamic Games imports
import SignalChain from '../games/SignalChain';
import FlashSort from '../games/FlashSort';
import LighthouseWatch from '../games/LighthouseWatch';
import ContextSwitch from '../games/ContextSwitch';
import WordWeave from '../games/WordWeave';
import PatternFold from '../games/PatternFold';

const GAME_COMPONENTS = {
  'signal-chain': SignalChain,
  'flash-sort': FlashSort,
  'lighthouse-watch': LighthouseWatch,
  'context-switch': ContextSwitch,
  'word-weave': WordWeave,
  'pattern-fold': PatternFold,
};

const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

const getDifficultyLabel = (level) => {
  if (level <= 1) return 'beginner';
  if (level <= 3) return 'intermediate';
  return 'advanced';
};

function StreakBadgeWithAnimation({ multiplier, domainColor }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [multiplier]);

  const animatedStyle = {
    opacity: animValue,
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1.0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[
      {
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
      },
      animatedStyle
    ]}>
      <Text style={{
        fontFamily: Typography.fontFamily.bold,
        fontSize: Typography.size.caption,
        color: domainColor || '#FFC000',
      }}>
        ×{multiplier.toFixed(2).replace(/\.00$/, '')}
      </Text>
    </Animated.View>
  );
}

export function ActiveSessionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const DOMAINS = getDomains(Colors);
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const { dispatch } = useApp();

  const singleExercise = route?.params?.singleExercise;
  const remainingExercises = route?.params?.remainingExercises;
  
  // Resolve exercise to play
  const [exercises, setExercises] = useState(
    singleExercise ? [singleExercise] : (remainingExercises || null)
  );

  useEffect(() => {
    let active = true;
    if (!singleExercise && !remainingExercises) {
      exerciseService.getDailyWorkout().then(workout => {
        if (active) setExercises(workout);
      });
    }
    return () => { active = false; };
  }, [singleExercise, remainingExercises]);

  const currentEx = exercises?.[0] || null;
  const domain = DOMAINS.find(d => d.id === currentEx?.domain);

  // Shared Engine Hooks
  const {
    activeTimeElapsed,
    isActive,
    isComplete,
    pauseCount,
    pause,
    resume,
    setIsActive,
  } = useSessionTimer();

  const {
    currentLevel,
    recordCorrect,
    recordMiss,
    saveLevel,
  } = useAdaptiveLadder(currentEx?.id);

  const {
    streakCount,
    multiplier,
    recordCorrect: recordStreakCorrect,
    recordMiss: recordStreakMiss,
    reset: resetStreak,
  } = useStreakMultiplier();

  // Component local state
  const [phase, setPhase] = useState('intro'); // 'intro' | 'playing' | 'paused' | 'countdown' | 'complete'
  const [countdownVal, setCountdownVal] = useState(3);
  const [roundScores, setRoundScores] = useState([]);
  const [runningScore, setRunningScore] = useState(0);
  const [visualScore, setVisualScore] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Game specific accrued metrics
  const [gameMetrics, setGameMetrics] = useState({});
  const [showFlashSortIntroTip, setShowFlashSortIntroTip] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Animations
  const introFade = useRef(new Animated.Value(1)).current;
  const playAreaFade = useRef(new Animated.Value(1)).current;

  // Track max streak
  useEffect(() => {
    if (streakCount > maxStreak) {
      setMaxStreak(streakCount);
    }
  }, [streakCount, maxStreak]);

  useEffect(() => {
    if (currentEx?.id === 'flash-sort') {
      AsyncStorage.getItem('cognify:tutorial:flashSort:introTip').then((val) => {
        if (!val) {
          setShowFlashSortIntroTip(true);
        }
      });
    }
  }, [currentEx?.id]);

  // Handle Session completion
  useEffect(() => {
    if (isComplete && phase === 'playing') {
      setPhase('complete');
      setIsActive(false);
      
      // Save reached difficulty level & date
      saveLevel(currentLevel);

      // Play 300ms active stimulus fade to 0
      Animated.timing(playAreaFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Play 500ms score count-up ease-out
        let startVal = runningScore;
        let endVal = runningScore; // runningScore is already final
        setVisualScore(runningScore);

        // Calculate session results statistics
        const finalScore = runningScore;
        const totalRounds = roundsCompleted || 1;
        const accuracyPct = Math.round((correctRounds / totalRounds) * 100);

        // Fetch previous scores to calculate delta
        const prevSessionKey = `cognify:previousScore:${currentEx.id}`;
        AsyncStorage.getItem(prevSessionKey).then((val) => {
          const prevScore = val ? parseInt(val, 10) : null;
          
          // Save today's score as the new previous score for next time
          AsyncStorage.setItem(prevSessionKey, String(finalScore));

          setTimeout(() => {
            // Dispatch COMPLETE_WORKOUT to the global store with score payload
            let normalisedScore = finalScore;
            if (currentEx.id === 'signal-chain') {
              normalisedScore = normaliseSessionScore(finalScore, gameMetrics.averageLevel || currentLevel);
            } else if (currentEx.id === 'flash-sort') {
              normalisedScore = normaliseFlashSortSessionScore(finalScore, gameMetrics.averageLevel || currentLevel);
            }

            // Normalize score to 0-1000 scale (multiply by 10)
            const finalSessionScore = (currentEx.id === 'signal-chain' || currentEx.id === 'flash-sort')
              ? normalisedScore * 10
              : normalisedScore;

            dispatch(completeWorkout({
              domain: currentEx.domain,
              sessionScore: finalSessionScore,
            }));

            // Navigate to shared SessionResultScreen
            navigation.navigate('SessionResult', {
              exercise: currentEx,
              score: finalScore,
              prevScore: prevScore,
              roundsCompleted: roundsCompleted,
              accuracy: accuracyPct,
              longestStreak: maxStreak,
              gameSpecificMetrics: currentEx.id === 'signal-chain' ? {
                ...gameMetrics,
                bestSequence: gameMetrics.bestSequence || 0,
                avgPerRound: Math.round(finalScore / (roundsCompleted || 1)),
                difficultyReached: `${gameMetrics.difficultyTier || 'easy'} (level ${currentLevel})`,
              } : (currentEx.id === 'flash-sort' ? {
                ...gameMetrics,
                bestSequence: gameMetrics.bestSequence || 0,
                avgPerRound: Math.round(finalScore / (roundsCompleted || 1)),
                difficultyReached: `${gameMetrics.difficultyTier || 'easy'} (level ${currentLevel})`,
                meanReactionTime: gameMetrics.meanReactionTime || 0,
                fastestRT: gameMetrics.fastestRT || 0,
              } : gameMetrics),
              remainingExercises: exercises.slice(1), // pass remaining daily workout
            });
          }, 500);
        });
      });
    }
  }, [isComplete, phase]);

  const executeExit = () => {
    if (currentEx?.id === 'signal-chain') {
      if (roundsCompleted >= 5) {
        // Save partial score
        saveLevel(currentLevel);
        const finalScore = runningScore;
        const totalRounds = roundsCompleted || 1;
        const accuracyPct = Math.round((correctRounds / totalRounds) * 100);

        const prevSessionKey = `cognify:previousScore:${currentEx.id}`;
        AsyncStorage.getItem(prevSessionKey).then((val) => {
          const prevScore = val ? parseInt(val, 10) : null;
          AsyncStorage.setItem(prevSessionKey, String(finalScore));

          const normalisedScore = normaliseSessionScore(finalScore, gameMetrics.averageLevel || currentLevel);
          const domainScoreUpdate = normalisedScore * 10;

          dispatch(completeWorkout({
            domain: currentEx.domain,
            sessionScore: domainScoreUpdate,
          }));

          navigation.navigate('SessionResult', {
            exercise: currentEx,
            score: finalScore,
            prevScore: prevScore,
            roundsCompleted: roundsCompleted,
            accuracy: accuracyPct,
            longestStreak: maxStreak,
            gameSpecificMetrics: {
              ...gameMetrics,
              bestSequence: gameMetrics.bestSequence || 0,
              avgPerRound: Math.round(finalScore / (roundsCompleted || 1)),
              difficultyReached: `${gameMetrics.difficultyTier || 'easy'} (level ${currentLevel})`,
              sessionEndedEarly: true,
            },
            remainingExercises: exercises.slice(1),
          });
        });
      } else {
        navigation.navigate('TrainRoot');
      }
    } else if (currentEx?.id === 'flash-sort') {
      if (roundsCompleted >= 10) {
        // Save partial score
        saveLevel(currentLevel);
        const finalScore = runningScore;
        const totalRounds = roundsCompleted || 1;
        const accuracyPct = Math.round((correctRounds / totalRounds) * 100);

        const prevSessionKey = `cognify:previousScore:${currentEx.id}`;
        AsyncStorage.getItem(prevSessionKey).then((val) => {
          const prevScore = val ? parseInt(val, 10) : null;
          AsyncStorage.setItem(prevSessionKey, String(finalScore));

          const normalisedScore = normaliseFlashSortSessionScore(finalScore, gameMetrics.averageLevel || currentLevel);
          const domainScoreUpdate = normalisedScore * 10;

          dispatch(completeWorkout({
            domain: currentEx.domain,
            sessionScore: domainScoreUpdate,
          }));

          navigation.navigate('SessionResult', {
            exercise: currentEx,
            score: finalScore,
            prevScore: prevScore,
            roundsCompleted: roundsCompleted,
            accuracy: accuracyPct,
            longestStreak: maxStreak,
            gameSpecificMetrics: {
              ...gameMetrics,
              bestSequence: gameMetrics.bestSequence || 0,
              avgPerRound: Math.round(finalScore / (roundsCompleted || 1)),
              difficultyReached: `${gameMetrics.difficultyTier || 'easy'} (level ${currentLevel})`,
              meanReactionTime: gameMetrics.meanReactionTime || 0,
              fastestRT: gameMetrics.fastestRT || 0,
              sessionEndedEarly: true,
            },
            remainingExercises: exercises.slice(1),
          });
        });
      } else {
        navigation.navigate('TrainRoot');
      }
    } else if (currentEx?.id === 'lighthouse-watch') {
      if (roundsCompleted >= 15) {
        // Save partial score
        saveLevel(currentLevel);
        const finalScore = runningScore;
        const totalRounds = roundsCompleted || 1;
        const accuracyPct = Math.round((correctRounds / totalRounds) * 100);

        const prevSessionKey = `cognify:previousScore:${currentEx.id}`;
        AsyncStorage.getItem(prevSessionKey).then((val) => {
          const prevScore = val ? parseInt(val, 10) : null;
          AsyncStorage.setItem(prevSessionKey, String(finalScore));

          dispatch(completeWorkout({
            domain: currentEx.domain,
            sessionScore: finalScore,
          }));

          navigation.navigate('SessionResult', {
            exercise: currentEx,
            score: finalScore,
            prevScore: prevScore,
            roundsCompleted: roundsCompleted,
            accuracy: accuracyPct,
            longestStreak: maxStreak,
            gameSpecificMetrics: {
              ...gameMetrics,
              hits: gameMetrics.hits || 0,
              misses: gameMetrics.misses || 0,
              falseAlarms: gameMetrics.falseAlarms || 0,
              avgPerRound: Math.round(finalScore / (roundsCompleted || 1)),
              difficultyReached: `${gameMetrics.difficultyTier || 'Easy'} (Level ${currentLevel})`,
              sessionEndedEarly: true,
            },
            remainingExercises: exercises.slice(1),
          });
        });
      } else {
        navigation.navigate('TrainRoot');
      }
    } else {
      navigation.goBack();
    }
  };

  const confirmExit = () => {
    if (currentEx?.id === 'signal-chain' || currentEx?.id === 'flash-sort' || currentEx?.id === 'lighthouse-watch') {
      setShowExitConfirm(true);
    } else {
      Alert.alert(t('train.activeSession.exitTitle'), t('train.activeSession.exitSubtitle'), [
        { text: t('train.activeSession.exitCancel'), style: 'cancel' },
        { text: t('train.activeSession.exitConfirm'), onPress: () => navigation.goBack(), style: 'destructive' },
      ]);
    }
  };

  const startExercise = () => {
    Animated.timing(introFade, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (currentEx?.id === 'signal-chain') {
        setPhase('countdown');
        setCountdownVal(3);
        
        let count = 3;
        const interval = setInterval(() => {
          count -= 1;
          if (count === 0) {
            clearInterval(interval);
            setPhase('playing');
            setIsActive(true);
          } else {
            setCountdownVal(count);
          }
        }, 400);
      } else {
        setPhase('playing');
        setIsActive(true);
      }
    });
  };

  const handlePauseGesture = () => {
    if (pause()) {
      setPhase('paused');
    }
  };

  const handleResumeGesture = () => {
    setPhase('countdown');
    setCountdownVal(3);

    // 3-2-1 Countdown (300ms each for Signal Chain, 400ms for others)
    const countdownInterval = currentEx?.id === 'signal-chain' ? 300 : 400;
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(interval);
        setPhase('playing');
        resume();
      } else {
        setCountdownVal(count);
      }
    }, countdownInterval);
  };

  const handleRoundComplete = ({ isCorrect, scoreProps = { baseScore: 0, speedBonus: 0, maxScore: 100 }, metrics = {} }) => {
    // Increment total rounds completed
    setRoundsCompleted((prev) => prev + 1);

    let roundScore = 0;

    if (currentEx?.id === 'lighthouse-watch') {
      // Accumulate Lighthouse Watch metrics
      setGameMetrics((prev) => {
        const hits = (prev.hits || 0) + (metrics.isHit ? 1 : 0);
        const misses = (prev.misses || 0) + (metrics.isMiss ? 1 : 0);
        const falseAlarms = (prev.falseAlarms || 0) + (metrics.isFalseAlarm ? 1 : 0);
        const levelSum = (prev.levelSum || 0) + currentLevel;
        const count = (prev.count || 0) + 1;
        const averageLevel = levelSum / count;

        return {
          ...prev,
          hits,
          misses,
          falseAlarms,
          levelSum,
          count,
          averageLevel,
          difficultyTier: metrics.tier || prev.difficultyTier || 'Easy',
        };
      });

      // Update adaptive ladder and haptics
      if (metrics.isHit) {
        setCorrectRounds((prev) => prev + 1);
        recordCorrect();
        
        const newStreak = streakCount + 1;
        recordStreakCorrect();

        if (newStreak === 3 || newStreak === 6 || newStreak === 10) {
          GameHaptics.streakMilestone();
        } else {
          GameHaptics.correct();
        }
      } else if (metrics.isMiss) {
        recordMiss();
        recordStreakMiss();
        GameHaptics.incorrect();
      } else if (metrics.isFalseAlarm) {
        recordMiss(); // False alarms count as failures for ladder
        recordStreakMiss();
        GameHaptics.incorrect();
      }

      // Use the raw round score directly from Lighthouse Watch metrics to ensure total precision
      roundScore = metrics.roundScore || 0;
      setRoundScores((prev) => [...prev, roundScore]);
      setRunningScore((prev) => Math.max(0, prev + roundScore));
      setVisualScore((prev) => Math.max(0, prev + roundScore));
      
      return;
    }

    if (currentEx?.id === 'signal-chain') {
      // Accumulate Signal Chain metrics
      setGameMetrics((prev) => {
        const nextSequence = Math.max(prev.bestSequence || 0, metrics.bestSequence || 0);
        const levelSum = (prev.levelSum || 0) + currentLevel;
        const count = (prev.count || 0) + 1;
        const averageLevel = levelSum / count;

        return {
          ...prev,
          bestSequence: nextSequence,
          levelSum,
          count,
          averageLevel,
          difficultyTier: metrics.tier || prev.difficultyTier || 'easy',
        };
      });

      // Update scoring and haptics inside the game
      if (isCorrect) {
        setCorrectRounds((prev) => prev + 1);
        recordCorrect();
        
        const newStreak = streakCount + 1;
        recordStreakCorrect();

        if (newStreak === 3 || newStreak === 6 || newStreak === 10) {
          GameHaptics.streakMilestone();
        } else {
          GameHaptics.correct();
        }
      } else {
        recordMiss();
        recordStreakMiss();
        GameHaptics.incorrect();
      }

      // Use the raw round score directly from Signal Chain metrics to ensure total precision
      roundScore = metrics.roundScore || 0;
      setRoundScores((prev) => [...prev, roundScore]);
      setRunningScore((prev) => Math.max(0, prev + roundScore));
      setVisualScore((prev) => Math.max(0, prev + roundScore));
      
      return;
    }

    if (metrics?.isFalseAlarm) {
      // Lighthouse Watch False Alarm direct penalty
      roundScore = -50;
      recordMiss();
      recordStreakMiss();
      GameHaptics.incorrect();

      // Accrue false alarm count
      setGameMetrics((prev) => ({
        ...prev,
        falseAlarms: (prev.falseAlarms || 0) + 1,
      }));
    } else if (isCorrect) {
      // Correct answer
      setCorrectRounds((prev) => prev + 1);
      recordCorrect();
      
      const newStreak = streakCount + 1;
      recordStreakCorrect();

      // Check if threshold crossing for milestone haptics
      if (newStreak === 3 || newStreak === 6 || newStreak === 10) {
        GameHaptics.streakMilestone();
      } else {
        GameHaptics.correct();
      }

      // Calculate round score
      roundScore = calculateRoundScore({
        baseScore: scoreProps.baseScore,
        speedBonus: scoreProps.speedBonus || 0,
        multiplier: multiplier,
        maxScore: scoreProps.maxScore || 100,
      });

      // Accrue Hits for attention game
      if (currentEx.id === 'lighthouse-watch') {
        setGameMetrics((prev) => ({
          ...prev,
          hits: (prev.hits || 0) + 1,
        }));
      }
    } else {
      // Incorrect answer / Miss
      recordMiss();
      recordStreakMiss();
      GameHaptics.incorrect();

      roundScore = 0;

      // Accrue Misses / Errors
      if (currentEx.id === 'lighthouse-watch') {
        setGameMetrics((prev) => ({
          ...prev,
          misses: (prev.misses || 0) + 1,
        }));
      } else if (currentEx.id === 'pattern-fold' && metrics?.isMirrorError) {
        setGameMetrics((prev) => ({
          ...prev,
          mirrorErrors: (prev.mirrorErrors || 0) + 1,
        }));
      }
    }

    // Accrue speed reaction times
    if (metrics?.reactionTimeMs !== undefined) {
      setGameMetrics((prev) => {
        const rts = prev.reactionTimes || [];
        const nextRts = [...rts, metrics.reactionTimeMs];
        const avgRt = Math.round(nextRts.reduce((a, b) => a + b, 0) / nextRts.length);
        return {
          ...prev,
          reactionTimes: nextRts,
          meanReactionTime: avgRt,
        };
      });
    }

    // Accrue rule switch latencies for Context Switch
    if (metrics?.isSwitchRound !== undefined && metrics?.reactionTimeMs !== undefined) {
      setGameMetrics((prev) => {
        const switchRTs = prev.switchRTs || [];
        const stayRTs = prev.stayRTs || [];
        if (metrics.isSwitchRound) {
          switchRTs.push(metrics.reactionTimeMs);
        } else {
          stayRTs.push(metrics.reactionTimeMs);
        }
        
        const meanSwitch = switchRTs.length ? (switchRTs.reduce((a, b) => a + b, 0) / switchRTs.length) : 0;
        const meanStay = stayRTs.length ? (stayRTs.reduce((a, b) => a + b, 0) / stayRTs.length) : 0;
        const switchCost = Math.max(0, Math.round(meanSwitch - meanStay));

        return {
          ...prev,
          switchRTs,
          stayRTs,
          switchCost,
        };
      });
    }

    // Update running score & scores list
    setRoundScores((prev) => [...prev, roundScore]);
    setRunningScore((prev) => Math.max(0, prev + roundScore));
    setVisualScore((prev) => Math.max(0, prev + roundScore));
  };

  if (!exercises || !currentEx) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  // ── INTRO PHASE ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const isDaily = remainingExercises && remainingExercises.length > 0;
    const DomainIcon = domain?.icon;
    const gameKey = toCamelCase(currentEx.id);
    const steps = [
      t(`games.${gameKey}.instructions.1`),
      t(`games.${gameKey}.instructions.2`),
      t(`games.${gameKey}.instructions.3`),
    ].filter(Boolean);

    return (
      <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: introFade }]}>
        <StatusBar barStyle="dark-content" />

        {/* Zone 1 — Top Area (Close button absolute) */}
        <TouchableOpacity style={styles.exitBtn} onPress={confirmExit} activeOpacity={0.8}>
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.introContent}>
          {/* Centered Large Domain Icon */}
          <View style={styles.iconContainer}>
            {DomainIcon && <DomainIcon size={80} color={domain?.color.main} />}
          </View>

          {/* Zone 2 — Middle Area */}
          <View style={styles.middleZone}>
            <View style={[styles.domainPill, { backgroundColor: domain?.color.light }]}>
              <Text style={[styles.domainPillText, { color: domain?.color.main }]}>{domain?.label}</Text>
            </View>
            <Text style={styles.exerciseName}>{currentEx.name}</Text>
            <Text style={styles.exerciseDesc}>{currentEx.description}</Text>
            
            {/* Numbered Steps */}
            <View style={[styles.instructionCard, { backgroundColor: domain?.color.light }]}>
              {steps.map((step, idx) => (
                <View key={idx} style={styles.instructionRow}>
                  <View style={[styles.numberCircle, { backgroundColor: domain?.color.main }]}>
                    <Text style={styles.numberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {currentEx.id === 'flash-sort' && showFlashSortIntroTip && (
              <TouchableOpacity
                style={[styles.tipCard, { backgroundColor: 'rgba(255, 192, 0, 0.08)', borderColor: '#FFC000', borderWidth: 1 }]}
                onPress={() => {
                  setShowFlashSortIntroTip(false);
                  AsyncStorage.setItem('cognify:tutorial:flashSort:introTip', 'true');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipTitle, { color: '#D89E00' }]}>💡 speed tip</Text>
                <Text style={[styles.tipBody, { color: Colors.textSecondary }]}>
                  your score is based on speed — respond the moment you recognise the shape.
                </Text>
                <Text style={[styles.tipDismiss, { color: Colors.textTertiary }]}>
                  tap to dismiss
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Zone 3 — Bottom Area */}
          <View style={styles.bottomZone}>
            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <Clock size={14} color={Colors.textMuted} style={styles.metadataIcon} />
                <Text style={styles.metadataText}>60s session</Text>
              </View>
              <Text style={styles.metadataSeparator}>·</Text>
              <View style={styles.metadataItem}>
                <BarChart2 size={14} color={Colors.textMuted} style={styles.metadataIcon} />
                <Text style={styles.metadataText}>{getDifficultyLabel(currentLevel)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startBtn}
              onPress={startExercise}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>{t('train.activeSession.start')}</Text>
            </TouchableOpacity>

            {/* Workout Progress Dots */}
            {isDaily && (
              <View style={styles.exerciseProgress}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const currentExIndex = 4 - (remainingExercises?.length || 0) - 1;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.exerciseDot,
                        i === currentExIndex && { backgroundColor: domain?.color.main, width: 20 },
                        i < currentExIndex && { backgroundColor: Colors.positive },
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── PLAYING / PAUSED / COUNTDOWN ─────────────────────────────────────────
  const GameComponent = GAME_COMPONENTS[currentEx.id] || FlashSort;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {/* Top Header Bar with Three Zones */}
      <View style={styles.topBar}>
        {/* Left Zone: Domain Chip + Streak Badge */}
        <View style={styles.leftHeaderZone}>
          <View style={[styles.domainChip, { backgroundColor: domain?.color.light }]}>
            <Text style={[styles.domainChipText, { color: domain?.color.main }]}>{domain?.label}</Text>
          </View>
          {multiplier > 1.0 && (
            <StreakBadgeWithAnimation multiplier={multiplier} domainColor={domain?.color.main} />
          )}
        </View>

        {/* Centre Zone: Pause Button */}
        <View style={styles.centreHeaderZone}>
          <TouchableOpacity style={styles.headerPauseBtn} onPress={handlePauseGesture}>
            <Pause size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Right Zone: Score Display */}
        <View style={styles.rightHeaderZone}>
          <ScoreDisplay score={visualScore} />
        </View>
      </View>

      {/* Draining Timer Bar */}
      <SessionTimerBar
        activeTimeElapsed={activeTimeElapsed}
        totalDuration={60000}
        pulse={currentEx.id === 'lighthouse-watch'}
      />

      {/* Main Play Area */}
      <Animated.View style={[styles.playArea, { opacity: playAreaFade }]}>
        <GameComponent
          level={currentLevel}
          isActive={phase === 'playing'}
          onRoundComplete={handleRoundComplete}
          Colors={Colors}
          multiplier={multiplier}
          streakCount={streakCount}
          onTimerStateChange={(timerActive) => setIsActive(timerActive && phase === 'playing')}
        />
      </Animated.View>

      {/* ── PAUSE OVERLAY (Premium Restructured 3-Zone Layout) ────────────────────────────────────────────────────── */}
      {phase === 'paused' && (
        <View style={[StyleSheet.absoluteFill, styles.pausedOverlayContainer]}>
          {/* Top Zone: Frozen Timer Bar + Game Identity Strip */}
          <View style={styles.pausedTopZone}>
            {/* Frozen Timer Bar with label */}
            <View style={styles.pausedTimerContainer}>
              <View style={[styles.pausedTimerTrack, { backgroundColor: Colors.border }]}>
                <View
                  style={[
                    styles.pausedTimerFill,
                    {
                      width: `${Math.max(0, 1 - activeTimeElapsed / 60000) * 100}%`,
                      backgroundColor: Colors.domain?.speed?.main || '#FFC000',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.pausedBarLabel, { color: Colors.textMuted }]}>
                PAUSED
              </Text>
            </View>

            {/* Game Identity Strip */}
            <View style={styles.pausedGameIdentity}>
              <View style={[styles.domainChip, { backgroundColor: domain?.color.light, alignSelf: 'center' }]}>
                <Text style={[styles.domainChipText, { color: domain?.color.main }]}>{domain?.label}</Text>
              </View>
              <Text style={[styles.pausedGameTitle, { color: Colors.textPrimary }]}>
                {currentEx.name}
              </Text>
            </View>
          </View>

          {/* Middle Zone: "paused" title + Static session snapshot metric cards */}
          <View style={styles.pausedMiddleZone}>
            <Text style={[styles.pausedTitleMain, { color: Colors.textPrimary }]}>
              {t('train.activesession.pausedTitle')}
            </Text>
            
            <View style={styles.pausedSnapshotGrid}>
              <View style={[styles.pausedSnapshotCard, { backgroundColor: Colors.surfaceAlt }]}>
                <Text style={[styles.pausedSnapshotValue, { color: Colors.textPrimary }]}>
                  {runningScore}
                </Text>
                <Text style={[styles.pausedSnapshotLabel, { color: Colors.textSecondary }]}>
                  score
                </Text>
              </View>

              <View style={[styles.pausedSnapshotCard, { backgroundColor: Colors.surfaceAlt }]}>
                <Text style={[styles.pausedSnapshotValue, { color: Colors.textPrimary }]}>
                  {roundsCompleted}
                </Text>
                <Text style={[styles.pausedSnapshotLabel, { color: Colors.textSecondary }]}>
                  rounds
                </Text>
              </View>

              <View style={[styles.pausedSnapshotCard, { backgroundColor: Colors.surfaceAlt }]}>
                <Text style={[styles.pausedSnapshotValue, { color: Colors.textPrimary }]}>
                  {streakCount === 0 ? '—' : `${streakCount}`}
                </Text>
                <Text style={[styles.pausedSnapshotLabel, { color: Colors.textSecondary }]}>
                  streak
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Zone: Pause count + Resume Button + Exit Session Button */}
          <View style={styles.pausedBottomZone}>
            {/* Pause count with warn state */}
            {2 - pauseCount > 0 ? (
              <Text style={[styles.pauseCountLabel, { color: Colors.textMuted }]}>
                {t('train.activesession.pauseCount', { used: pauseCount, max: 2 })}
              </Text>
            ) : (
              <Text style={[styles.pauseCountLabel, { color: '#FFC000', fontFamily: Typography.fontFamily.semiBold }]}>
                last pause — pausing again won't work
              </Text>
            )}

            <TouchableOpacity
              style={[styles.pausedResumeBtn, { backgroundColor: Colors.brandPrimary }]}
              onPress={handleResumeGesture}
              activeOpacity={0.85}
            >
              <Play size={20} color={Colors.textInverse} style={{ marginRight: Spacing[2] }} />
              <Text style={[styles.pausedResumeText, { color: Colors.textInverse }]}>
                {t('train.activesession.resume')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pausedExitBtn}
              onPress={() => setShowExitConfirm(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pausedExitText, { color: Colors.textSecondary }]}>
                {t('train.activesession.exitSession')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── COUNTDOWN OVERLAY ────────────────────────────────────────────────── */}
      {phase === 'countdown' && (
        <View style={[StyleSheet.absoluteFill, styles.overlayContainer]}>
          <Text style={styles.countdownNumber}>{countdownVal}</Text>
        </View>
      )}

      {/* Reusable Safe Exit Confirmation Modal */}
      <ConfirmModal
        visible={showExitConfirm}
        title={t('train.activesession.exitConfirmTitle')}
        body={t('train.activesession.exitConfirmBody')}
        cancelText={t('train.activesession.keepPlaying')}
        confirmText={t('train.activesession.exit')}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          executeExit();
        }}
        Colors={Colors}
      />
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  
  // Intro Phase
  exitBtn: {
    position: 'absolute',
    top: Spacing[6],
    right: Spacing[5],
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  introContent: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing[4],
  },
  iconContainer: {
    marginTop: Spacing[10],
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  middleZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: Spacing[4],
    paddingVertical: Spacing[4],
  },
  domainPill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  domainPillText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.label,
    textTransform: 'lowercase',
  },
  exerciseName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.display,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  exerciseDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionCard: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    width: '100%',
    gap: Spacing[3],
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  numberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.textInverse,
  },
  stepText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    flex: 1,
    textTransform: 'lowercase',
  },
  bottomZone: {
    width: '100%',
    justifyContent: 'flex-end',
    gap: Spacing[4],
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    marginRight: Spacing[1],
  },
  metadataText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  metadataSeparator: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    marginHorizontal: Spacing[1],
  },
  startBtn: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: Radius.full,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing[5],
    marginBottom: Spacing[8],
    ...Shadow.sm,
  },
  startBtnText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
  exerciseProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing[8],
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },

  // Playing Phase
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing[6], paddingVertical: Spacing[4] },
  domainChip: { borderRadius: Radius.sm, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  domainChipText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.caption, textTransform: 'lowercase' },
  scoreContainer: { alignItems: 'flex-end', gap: 2 },
  playArea: { flex: 1, width: '100%' },
  pauseTrigger: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: Spacing[6],
    ...Shadow.sm,
  },

  // Pause & Countdown Overlays
  overlayContainer: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing[8],
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingVertical: 16,
    paddingHorizontal: 32,
    ...Shadow.md,
  },
  resumeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
  countdownNumber: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 72,
    color: Colors.brandPrimary,
  },
  tipCard: {
    width: '100%',
    padding: Spacing[4],
    borderRadius: Radius.lg,
    marginTop: Spacing[4],
    gap: Spacing[2],
  },
  tipTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    textTransform: 'lowercase',
  },
  tipBody: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.body,
    lineHeight: 20,
    textTransform: 'lowercase',
  },
  tipDismiss: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    textAlign: 'right',
    textTransform: 'lowercase',
    marginTop: Spacing[1],
  },
  leftHeaderZone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  centreHeaderZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightHeaderZone: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerPauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  pausedOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.appBg,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    paddingTop: Spacing[12] + 20,
    paddingBottom: Spacing[12],
    paddingHorizontal: Spacing[6],
  },
  pausedTopZone: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing[6],
  },
  pausedTimerContainer: {
    width: '100%',
    alignItems: 'flex-end',
    gap: Spacing[1],
  },
  pausedTimerTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  pausedTimerFill: {
    height: '100%',
  },
  pausedBarLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.micro,
    letterSpacing: 0.5,
  },
  pausedGameIdentity: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  pausedGameTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h3,
    textTransform: 'lowercase',
    textAlign: 'center',
  },
  pausedMiddleZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: Spacing[8],
  },
  pausedTitleMain: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.display,
    textTransform: 'lowercase',
    textAlign: 'center',
  },
  pausedSnapshotGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[3],
    width: '100%',
  },
  pausedSnapshotCard: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    ...Shadow.sm,
  },
  pausedSnapshotValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h2,
  },
  pausedSnapshotLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    textTransform: 'lowercase',
    marginTop: 2,
  },
  pausedBottomZone: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing[3],
  },
  pauseCountLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    textTransform: 'lowercase',
    marginBottom: Spacing[1],
  },
  pausedResumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    height: 56,
    width: '100%',
    ...Shadow.md,
  },
  pausedResumeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    textTransform: 'lowercase',
  },
  pausedExitBtn: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedExitText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    textTransform: 'lowercase',
  },
});
