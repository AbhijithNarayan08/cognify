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
import { DynamicChainLink, DynamicStar, DynamicBrain, DynamicSun, DynamicFlash, DynamicLighthouse, DynamicWordWeave } from '../../../shared/components/MascotCharacters';

// Dynamic Games imports
import SignalChain from '../games/SignalChain';
import FlashSort from '../games/FlashSort';
import LighthouseWatch from '../games/LighthouseWatch';
import ContextSwitch from '../games/ContextSwitch';
import WordWeave from '../games/WordWeave';
import PatternFold from '../games/PatternFold';
import { computeSpatialEfficiency, computeAngleAccuracy, computeFoilBreakdown, detectPatterns, evaluateAdaptiveDifficulty } from '../games/patternFoldAnalytics';
import { PATTERN_FOLD } from '../../../constants/gameConfig';

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

function getZScore(p) {
  const clampP = Math.max(0.001, Math.min(0.999, p));
  const t = Math.sqrt(-2.0 * Math.log(clampP < 0.5 ? clampP : 1.0 - clampP));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  
  const num = c0 + c1 * t + c2 * t * t;
  const den = 1.0 + d1 * t + d2 * t * t + d3 * t * t * t;
  const z = t - num / den;
  return clampP < 0.5 ? -z : z;
}


const getDifficultyLabelKey = (level) => {
  if (level <= 1) return 'train.activeSession.difficulty.beginner';
  if (level <= 3) return 'train.activeSession.difficulty.intermediate';
  return 'train.activeSession.difficulty.advanced';
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

  // Ref to hold the latest parameters synchronously to avoid closure traps in the focus listener
  const paramsRef = useRef({ singleExercise, remainingExercises });
  paramsRef.current = { singleExercise, remainingExercises };
  
  // Resolve exercise to play
  const [exercises, setExercises] = useState(
    singleExercise ? [singleExercise] : (remainingExercises || null)
  );

  // Synchronously adjust state during the render pass if parameters change
  const [prevParams, setPrevParams] = useState({ singleExercise, remainingExercises });
  if (singleExercise !== prevParams.singleExercise || remainingExercises !== prevParams.remainingExercises) {
    setPrevParams({ singleExercise, remainingExercises });
    setExercises(singleExercise ? [singleExercise] : (remainingExercises || null));
  }

  // Shared Engine Hooks
  const {
    activeTimeElapsed,
    isActive,
    isComplete,
    pauseCount,
    pause,
    resume,
    reset: resetTimer,
    setIsActive,
  } = useSessionTimer();

  const {
    currentLevel,
    recordCorrect,
    recordMiss,
    saveLevel,
  } = useAdaptiveLadder(exercises?.[0]?.id);

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
  const [showLighthouseIntroTip, setShowLighthouseIntroTip] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Animations
  const introFade = useRef(new Animated.Value(1)).current;
  const playAreaFade = useRef(new Animated.Value(1)).current;

  // On mount, if no exercises are passed via params, fetch the daily workout
  useEffect(() => {
    if (!exercises || exercises.length === 0) {
      let active = true;
      exerciseService.getDailyWorkout().then(workout => {
        if (active && workout && workout.length > 0) {
          setExercises(workout);
        }
      });
      return () => { active = false; };
    }
  }, []);

  const currentEx = exercises?.[0] || null;
  const domain = DOMAINS.find(d => d.id === currentEx?.domain);

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
    } else if (currentEx?.id === 'lighthouse-watch') {
      AsyncStorage.getItem('cognify:tutorial:lighthouse:introTip').then((val) => {
        if (!val) {
          setShowLighthouseIntroTip(true);
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

          // Save complete session record for Lighthouse Watch
          if (currentEx.id === 'lighthouse-watch') {
            const totalHits = gameMetrics.hits || 0;
            const totalMisses = gameMetrics.misses || 0;
            const totalFalseAlarms = gameMetrics.falseAlarms || 0;
            const totalTargets = totalHits + totalMisses;
            const totalDistractors = Math.max(1, totalRounds - totalTargets);

            let correctedHits = totalHits;
            if (totalHits === totalTargets) {
              correctedHits = totalTargets - 0.5;
            } else if (totalHits === 0) {
              correctedHits = 0.5;
            }
            let correctedFalseAlarms = totalFalseAlarms;
            if (totalFalseAlarms === totalDistractors) {
              correctedFalseAlarms = totalDistractors - 0.5;
            } else if (totalFalseAlarms === 0) {
              correctedFalseAlarms = 0.5;
            }

            const hitRate = totalTargets > 0 ? correctedHits / totalTargets : 0.5;
            const faRate = totalDistractors > 0 ? correctedFalseAlarms / totalDistractors : 0.5;
            const dPrimeValue = getZScore(hitRate) - getZScore(faRate);

            const newRecord = {
              sessionId: Math.random().toString(36).substring(2, 11),
              timestamp: new Date().toISOString(),
              level: currentLevel,
              totalTargets,
              totalDistractors,
              hits: totalHits,
              misses: totalMisses,
              falseAlarms: totalFalseAlarms,
              hitRate: totalTargets > 0 ? totalHits / totalTargets : 0,
              faRate: totalDistractors > 0 ? totalFalseAlarms / totalDistractors : 0,
              dPrime: dPrimeValue,
              score: finalScore,
              longestStreak: maxStreak,
              quartiles: gameMetrics.quartiles || [
                { q: 0, hits: 0, misses: 0, falseAlarms: 0 },
                { q: 1, hits: 0, misses: 0, falseAlarms: 0 },
                { q: 2, hits: 0, misses: 0, falseAlarms: 0 },
                { q: 3, hits: 0, misses: 0, falseAlarms: 0 }
              ]
            };

            AsyncStorage.getItem('cognify:lighthouse:sessions').then((storedStr) => {
              let sessions = [];
              if (storedStr) {
                try {
                  sessions = JSON.parse(storedStr);
                } catch (e) {
                  sessions = [];
                }
              }
              sessions.unshift(newRecord);
              if (sessions.length > 100) {
                sessions = sessions.slice(0, 100);
              }
              AsyncStorage.setItem('cognify:lighthouse:sessions', JSON.stringify(sessions));
            });
          }

          // Save complete session record for Pattern Fold
          if (currentEx.id === 'pattern-fold') {
            const rounds = gameMetrics.rounds || [];
            const timingConfig = PATTERN_FOLD.timingLevels[currentLevel] || PATTERN_FOLD.timingLevels[1];
            const responseWindow = timingConfig.responseWindow;
            const computedEfficiency = computeSpatialEfficiency(rounds, responseWindow) || 0;
            const angleAccuracy = computeAngleAccuracy(rounds);
            const foilBreakdown = computeFoilBreakdown(rounds);
            const eliteSpeedCount = rounds.filter(r => r.eliteSpeed).length;
            const eliteSpeedRate = rounds.length > 0 ? eliteSpeedCount / rounds.length : 0;
            const avgReactionTimeMs = rounds.length > 0
              ? Math.round(rounds.reduce((s, r) => s + r.reactionTimeMs, 0) / rounds.length)
              : 0;

            const newRecord = {
              sessionId: Math.random().toString(36).substring(2, 11),
              timestamp: new Date().toISOString(),
              level: currentLevel,
              totalRounds: rounds.length,
              completedRounds: rounds.length,
              abandoned: rounds.length < 6,
              score: finalScore,
              spatialEfficiency: computedEfficiency,
              accuracy: accuracyPct,
              eliteSpeedCount,
              eliteSpeedRate,
              avgReactionTimeMs,
              angleAccuracy,
              foilBreakdown,
              rounds,
              patternIds: []
            };

            // Augment gameMetrics for immediate navigation use
            gameMetrics.spatialEfficiency = computedEfficiency;
            gameMetrics.angleAccuracy = angleAccuracy;
            gameMetrics.foilBreakdown = foilBreakdown;
            gameMetrics.eliteSpeedCount = eliteSpeedCount;
            gameMetrics.eliteSpeedRate = eliteSpeedRate;
            gameMetrics.avgReactionTimeMs = avgReactionTimeMs;
            gameMetrics.rounds = rounds;

            if (rounds.length >= 6) {
              AsyncStorage.getItem('cognify:patternfoldsessions').then((storedStr) => {
                let sessions = [];
                if (storedStr) {
                  try { sessions = JSON.parse(storedStr); } catch (e) { sessions = []; }
                }

                // Detect patterns
                const patterns = detectPatterns(newRecord, sessions.slice(0, 5));
                newRecord.patternIds = patterns;
                gameMetrics.patternIds = patterns;

                // Evaluate adaptive difficulty
                const adaptiveSuggestion = evaluateAdaptiveDifficulty([newRecord, ...sessions], currentLevel);
                if (adaptiveSuggestion) {
                  AsyncStorage.setItem('cognify:userPrefs:patternfold', JSON.stringify({
                    lastLevel: currentLevel,
                    adaptiveSuggestion
                  }));
                }

                sessions.unshift(newRecord);
                if (sessions.length > 100) {
                  sessions = sessions.slice(0, 100);
                }
                AsyncStorage.setItem('cognify:patternfoldsessions', JSON.stringify(sessions));
              });
            }
          }

          // Save complete session record for Context Switch
          if (currentEx.id === 'context-switch') {
            const rounds = gameMetrics.rounds || [];
            const switchRounds = rounds.filter(r => r.isSwitch);
            const stayRounds = rounds.filter(r => !r.isSwitch);

            const correctSwitches = switchRounds.filter(r => r.correct).length;
            const correctStays = stayRounds.filter(r => r.correct).length;

            const switchAccuracy = switchRounds.length ? Math.round((correctSwitches / switchRounds.length) * 100) : 0;
            const stayAccuracy = stayRounds.length ? Math.round((correctStays / stayRounds.length) * 100) : 0;
            
            const avgRT = (arr) => arr.length ? arr.reduce((s, r) => s + r.reactionTimeMs, 0) / arr.length : null;
            const avgSwitch = avgRT(switchRounds);
            const avgStay = avgRT(stayRounds);
            const switchCost = (avgSwitch !== null && avgStay !== null) ? Math.round(avgSwitch - avgStay) : 0;

            const ruleStats = ['shape', 'color', 'size', 'count'].reduce((acc, rule) => {
              const ruleRounds = rounds.filter(r => r.rule === rule);
              const ruleSwitches = ruleRounds.filter(r => r.isSwitch);
              acc[rule] = {
                attempts: ruleRounds.length,
                correct: ruleRounds.filter(r => r.correct).length,
                avgRTms: ruleRounds.length ? Math.round(avgRT(ruleRounds)) : 0,
                switchCostMs: (ruleSwitches.length && avgStay !== null) 
                  ? Math.round(avgRT(ruleSwitches) - avgStay) 
                  : 0
              };
              return acc;
            }, {});

            const timeoutCount = rounds.filter(r => r.timedOut).length;
            const timeoutRate = totalRounds > 0 ? timeoutCount / totalRounds : 0;

            const newRecord = {
              sessionId: Math.random().toString(36).substring(2, 11),
              timestamp: new Date().toISOString(),
              level: currentLevel,
              totalRounds,
              completedRounds: totalRounds,
              score: finalScore,
              accuracy: accuracyPct,
              switchAccuracy,
              stayAccuracy,
              switchCostMs: switchCost,
              longestStreak: maxStreak,
              timeoutRate,
              ruleStats,
              rounds
            };

            if (totalRounds >= 8) {
              AsyncStorage.getItem('cognify:contextswitch:sessions').then((storedStr) => {
                let sessions = [];
                if (storedStr) {
                  try { sessions = JSON.parse(storedStr); } catch (e) { sessions = []; }
                }
                sessions.unshift(newRecord);
                if (sessions.length > 100) {
                  sessions = sessions.slice(0, 100);
                }
                AsyncStorage.setItem('cognify:contextswitch:sessions', JSON.stringify(sessions));
              });
            }
          }

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
            navigation.replace('SessionResult', {
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

          navigation.replace('SessionResult', {
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

          navigation.replace('SessionResult', {
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

        const totalHits = gameMetrics.hits || 0;
        const totalMisses = gameMetrics.misses || 0;
        const totalFalseAlarms = gameMetrics.falseAlarms || 0;
        const totalTargets = totalHits + totalMisses;
        const totalDistractors = Math.max(1, totalRounds - totalTargets);

        let correctedHits = totalHits;
        if (totalHits === totalTargets) {
          correctedHits = totalTargets - 0.5;
        } else if (totalHits === 0) {
          correctedHits = 0.5;
        }
        let correctedFalseAlarms = totalFalseAlarms;
        if (totalFalseAlarms === totalDistractors) {
          correctedFalseAlarms = totalDistractors - 0.5;
        } else if (totalFalseAlarms === 0) {
          correctedFalseAlarms = 0.5;
        }

        const hitRate = totalTargets > 0 ? correctedHits / totalTargets : 0.5;
        const faRate = totalDistractors > 0 ? correctedFalseAlarms / totalDistractors : 0.5;
        const dPrimeValue = getZScore(hitRate) - getZScore(faRate);

        const newRecord = {
          sessionId: Math.random().toString(36).substring(2, 11),
          timestamp: new Date().toISOString(),
          level: currentLevel,
          totalTargets,
          totalDistractors,
          hits: totalHits,
          misses: totalMisses,
          falseAlarms: totalFalseAlarms,
          hitRate: totalTargets > 0 ? totalHits / totalTargets : 0,
          faRate: totalDistractors > 0 ? totalFalseAlarms / totalDistractors : 0,
          dPrime: dPrimeValue,
          score: finalScore,
          longestStreak: maxStreak,
          quartiles: gameMetrics.quartiles || [
            { q: 0, hits: 0, misses: 0, falseAlarms: 0 },
            { q: 1, hits: 0, misses: 0, falseAlarms: 0 },
            { q: 2, hits: 0, misses: 0, falseAlarms: 0 },
            { q: 3, hits: 0, misses: 0, falseAlarms: 0 }
          ],
          sessionEndedEarly: true
        };

        if (roundsCompleted >= 10) {
          AsyncStorage.getItem('cognify:lighthouse:sessions').then((storedStr) => {
            let sessions = [];
            if (storedStr) {
              try { sessions = JSON.parse(storedStr); } catch (e) { sessions = []; }
            }
            sessions.unshift(newRecord);
            if (sessions.length > 100) sessions = sessions.slice(0, 100);
            AsyncStorage.setItem('cognify:lighthouse:sessions', JSON.stringify(sessions));
          });
        }

        const prevSessionKey = `cognify:previousScore:${currentEx.id}`;
        AsyncStorage.getItem(prevSessionKey).then((val) => {
          const prevScore = val ? parseInt(val, 10) : null;
          AsyncStorage.setItem(prevSessionKey, String(finalScore));

          dispatch(completeWorkout({
            domain: currentEx.domain,
            sessionScore: finalScore,
          }));

          navigation.replace('SessionResult', {
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
    } else if (currentEx?.id === 'context-switch') {
      if (roundsCompleted >= 8) {
        // Save partial score
        saveLevel(currentLevel);
        const finalScore = runningScore;
        const totalRounds = roundsCompleted || 1;
        const accuracyPct = Math.round((correctRounds / totalRounds) * 100);

        const rounds = gameMetrics.rounds || [];
        const switchRounds = rounds.filter(r => r.isSwitch);
        const stayRounds = rounds.filter(r => !r.isSwitch);

        const correctSwitches = switchRounds.filter(r => r.correct).length;
        const correctStays = stayRounds.filter(r => r.correct).length;

        const switchAccuracy = switchRounds.length ? Math.round((correctSwitches / switchRounds.length) * 100) : 0;
        const stayAccuracy = stayRounds.length ? Math.round((correctStays / stayRounds.length) * 100) : 0;

        const avgRT = (arr) => arr.length ? arr.reduce((s, r) => s + r.reactionTimeMs, 0) / arr.length : null;
        const avgSwitch = avgRT(switchRounds);
        const avgStay = avgRT(stayRounds);
        const switchCost = (avgSwitch !== null && avgStay !== null) ? Math.round(avgSwitch - avgStay) : 0;

        const ruleStats = ['shape', 'color', 'size', 'count'].reduce((acc, rule) => {
          const ruleRounds = rounds.filter(r => r.rule === rule);
          const ruleSwitches = ruleRounds.filter(r => r.isSwitch);
          acc[rule] = {
            attempts: ruleRounds.length,
            correct: ruleRounds.filter(r => r.correct).length,
            avgRTms: ruleRounds.length ? Math.round(avgRT(ruleRounds)) : 0,
            switchCostMs: (ruleSwitches.length && avgStay !== null) 
              ? Math.round(avgRT(ruleSwitches) - avgStay) 
              : 0
          };
          return acc;
        }, {});

        const timeoutCount = rounds.filter(r => r.timedOut).length;
        const timeoutRate = totalRounds > 0 ? timeoutCount / totalRounds : 0;

        const newRecord = {
          sessionId: Math.random().toString(36).substring(2, 11),
          timestamp: new Date().toISOString(),
          level: currentLevel,
          totalRounds,
          completedRounds: totalRounds,
          score: finalScore,
          accuracy: accuracyPct,
          switchAccuracy,
          stayAccuracy,
          switchCostMs: switchCost,
          longestStreak: maxStreak,
          timeoutRate,
          ruleStats,
          rounds,
          sessionEndedEarly: true
        };

        AsyncStorage.getItem('cognify:contextswitch:sessions').then((storedStr) => {
          let sessions = [];
          if (storedStr) {
            try { sessions = JSON.parse(storedStr); } catch (e) { sessions = []; }
          }
          sessions.unshift(newRecord);
          if (sessions.length > 100) {
            sessions = sessions.slice(0, 100);
          }
          AsyncStorage.setItem('cognify:contextswitch:sessions', JSON.stringify(sessions));
        });

        const prevSessionKey = `cognify:previousScore:${currentEx.id}`;
        AsyncStorage.getItem(prevSessionKey).then((val) => {
          const prevScore = val ? parseInt(val, 10) : null;
          AsyncStorage.setItem(prevSessionKey, String(finalScore));

          dispatch(completeWorkout({
            domain: currentEx.domain,
            sessionScore: finalScore,
          }));

          navigation.replace('SessionResult', {
            exercise: currentEx,
            score: finalScore,
            prevScore: prevScore,
            roundsCompleted: roundsCompleted,
            accuracy: accuracyPct,
            longestStreak: maxStreak,
            gameSpecificMetrics: {
              ...gameMetrics,
              avgPerRound: Math.round(finalScore / (roundsCompleted || 1)),
              difficultyReached: `${gameMetrics.difficultyTier || 'Easy'} (Level ${currentLevel})`,
              sessionEndedEarly: true,
              switchCostMs: switchCost,
              switchAccuracy,
              stayAccuracy,
              ruleStats,
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
    if (phase === 'intro') {
      navigation.goBack();
    } else {
      setShowExitConfirm(true);
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

    // Pattern Fold round log accretion
    if (currentEx?.id === 'pattern-fold') {
      setGameMetrics((prev) => {
        const rounds = prev.rounds ? [...prev.rounds] : [];
        if (metrics.roundLogEntry) {
          rounds.push({
            ...metrics.roundLogEntry,
            roundIndex: roundsCompleted,
          });
        }
        return {
          ...prev,
          rounds,
          mirrorErrors: (prev.mirrorErrors || 0) + (metrics.isMirrorError ? 1 : 0),
        };
      });
    }

    if (currentEx?.id === 'lighthouse-watch') {
      // Accumulate Lighthouse Watch metrics
      setGameMetrics((prev) => {
        const hits = (prev.hits || 0) + (metrics.isHit ? 1 : 0);
        const misses = (prev.misses || 0) + (metrics.isMiss ? 1 : 0);
        const falseAlarms = (prev.falseAlarms || 0) + (metrics.isFalseAlarm ? 1 : 0);
        const levelSum = (prev.levelSum || 0) + currentLevel;
        const count = (prev.count || 0) + 1;
        const averageLevel = levelSum / count;

        // Initialize and update quartiles (four 15s blocks of a 60s session)
        const quartiles = prev.quartiles
          ? prev.quartiles.map((qObj) => ({ ...qObj }))
          : [
              { q: 0, hits: 0, misses: 0, falseAlarms: 0 },
              { q: 1, hits: 0, misses: 0, falseAlarms: 0 },
              { q: 2, hits: 0, misses: 0, falseAlarms: 0 },
              { q: 3, hits: 0, misses: 0, falseAlarms: 0 },
            ];

        // Determine current active quartile based on elapsed time (capped to 3)
        const qIndex = Math.min(3, Math.floor(activeTimeElapsed / 15000));
        if (metrics.isHit) quartiles[qIndex].hits++;
        if (metrics.isMiss) quartiles[qIndex].misses++;
        if (metrics.isFalseAlarm) quartiles[qIndex].falseAlarms++;

        return {
          ...prev,
          hits,
          misses,
          falseAlarms,
          levelSum,
          count,
          averageLevel,
          difficultyTier: metrics.tier || prev.difficultyTier || 'Easy',
          quartiles,
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

    if (currentEx?.id === 'context-switch') {
      // Accumulate Context Switch metrics
      setGameMetrics((prev) => {
        const rounds = prev.rounds ? [...prev.rounds] : [];
        rounds.push({
          roundIndex: roundsCompleted,
          rule: metrics.rule,
          prevRule: metrics.prevRule,
          isSwitch: metrics.isSwitchRound,
          correct: isCorrect,
          timedOut: metrics.isTimeout,
          reactionTimeMs: metrics.reactionTimeMs,
        });

        const switchRTs = prev.switchRTs || [];
        const stayRTs = prev.stayRTs || [];
        if (metrics.isSwitchRound) {
          switchRTs.push(metrics.reactionTimeMs);
        } else {
          stayRTs.push(metrics.reactionTimeMs);
        }
        const avgSwitch = switchRTs.length ? Math.round(switchRTs.reduce((a,b)=>a+b,0)/switchRTs.length) : 0;
        const avgStay = stayRTs.length ? Math.round(stayRTs.reduce((a,b)=>a+b,0)/stayRTs.length) : 0;
        const switchCost = avgSwitch - avgStay;

        return {
          ...prev,
          rounds,
          switchRTs,
          stayRTs,
          avgSwitch,
          avgStay,
          switchCost,
        };
      });

      // Update adaptive ladder and haptics
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

      // Calculate round score
      roundScore = calculateRoundScore({
        baseScore: scoreProps.baseScore,
        speedBonus: scoreProps.speedBonus || 0,
        multiplier: multiplier,
        maxScore: scoreProps.maxScore || 100,
      });

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

        <View style={styles.introContent}>
          {/* Centered Large Domain Icon or Animated Mascot */}
          <View style={styles.iconContainer}>
            {(() => {
              if (currentEx.id === 'signal-chain') return <DynamicChainLink size={192} />;
              if (currentEx.id === 'flash-sort') return <DynamicFlash size={192} />;
              if (currentEx.id === 'lighthouse-watch') return <DynamicLighthouse size={192} />;
              if (currentEx.id === 'context-switch') return <DynamicBrain size={192} />;
              if (currentEx.id === 'pattern-fold') return <DynamicSun size={192} />;
              if (currentEx.id === 'word-weave') return <DynamicWordWeave size={192} />;
              return DomainIcon ? <DomainIcon size={80} color={domain?.color.main} /> : null;
            })()}
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
                <Text style={[styles.tipTitle, { color: '#D89E00' }]}>{t('train.activeSession.speedTipTitle')}</Text>
                <Text style={[styles.tipBody, { color: Colors.textSecondary }]}>
                  {t('train.activeSession.speedTipBody')}
                </Text>
                <Text style={[styles.tipDismiss, { color: Colors.textTertiary }]}>
                  {t('train.activeSession.tapToDismiss')}
                </Text>
              </TouchableOpacity>
            )}

            {currentEx.id === 'lighthouse-watch' && showLighthouseIntroTip && (
              <TouchableOpacity
                style={[styles.tipCard, { backgroundColor: 'rgba(166, 98, 198, 0.08)', borderColor: '#A662C6', borderWidth: 1 }]}
                onPress={() => {
                  setShowLighthouseIntroTip(false);
                  AsyncStorage.setItem('cognify:tutorial:lighthouse:introTip', 'true');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipTitle, { color: '#A662C6' }]}>{t('train.activeSession.vigilanceTipTitle')}</Text>
                <Text style={[styles.tipBody, { color: Colors.textSecondary }]}>
                  {t('train.activeSession.vigilanceTipBody')}
                </Text>
                <Text style={[styles.tipDismiss, { color: Colors.textTertiary }]}>
                  {t('train.activeSession.tapToDismiss')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Zone 3 — Bottom Area */}
          <View style={styles.bottomZone}>
            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <Clock size={14} color={Colors.textMuted} style={styles.metadataIcon} />
                <Text style={styles.metadataText}>{t('train.activeSession.60sSession')}</Text>
              </View>
              <Text style={styles.metadataSeparator}>·</Text>
              <View style={styles.metadataItem}>
                <BarChart2 size={14} color={Colors.textMuted} style={styles.metadataIcon} />
                <Text style={styles.metadataText}>{t(getDifficultyLabelKey(currentLevel))}</Text>
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

        {/* Zone 1 — Top Area (Close button absolute) */}
        <TouchableOpacity style={styles.exitBtn} onPress={confirmExit} activeOpacity={0.8}>
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
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

      {/* Game Instruction Header */}
      {phase === 'playing' && (
        <View style={styles.instructionBanner}>
          <Text style={[styles.instructionText, { color: Colors.textSecondary }]}>
            {t(`exercise.${currentEx.id}.instruction`)}
          </Text>
        </View>
      )}

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
                  {t('train.activeSession.score')}
                </Text>
              </View>
              <View style={[styles.pausedSnapshotCard, { backgroundColor: Colors.surfaceAlt }]}>
                <Text style={[styles.pausedSnapshotValue, { color: Colors.textPrimary }]}>
                  {roundsCompleted}
                </Text>
                <Text style={[styles.pausedSnapshotLabel, { color: Colors.textSecondary }]}>
                  {t('train.activeSession.rounds')}
                </Text>
              </View>
              <View style={[styles.pausedSnapshotCard, { backgroundColor: Colors.surfaceAlt }]}>
                <Text style={[styles.pausedSnapshotValue, { color: Colors.textPrimary }]}>
                  {streakCount === 0 ? '—' : `${streakCount}`}
                </Text>
                <Text style={[styles.pausedSnapshotLabel, { color: Colors.textSecondary }]}>
                  {t('train.activeSession.streak')}
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
                {t('train.activesession.lastPause')}
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

  instructionBanner: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[6],
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
  
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
  domainChipText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.caption },
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
  },
  tipBody: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.body,
    lineHeight: 20,
  },
  tipDismiss: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    textAlign: 'right',
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
  },
  pausedExitBtn: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedExitText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
  },
});
