// src/features/train/screens/SessionResultScreen.js
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Target, Flame, Zap, ArrowRight, CornerDownLeft } from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const toCamelCase = (str) => {
  return str.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
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


import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../../theme';
import { t } from '../../../constants/useStrings';
import PatternFoldResults from './PatternFoldResults';

export default function SessionResultScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const DOMAINS = getDomains(Colors);
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const {
    exercise,
    score,
    prevScore,
    roundsCompleted,
    accuracy,
    longestStreak,
    gameSpecificMetrics = {},
    remainingExercises = [],
  } = route?.params || {};

  const domain = DOMAINS.find(d => d.id === exercise?.domain);

  const [allTimeBestSequence, setAllTimeBestSequence] = React.useState(0);
  const [isNewPersonalBest, setIsNewPersonalBest] = React.useState(false);
  const [hasLoadedBest, setHasLoadedBest] = React.useState(false);
  const celebrationPulse = React.useRef(new Animated.Value(1.0)).current;

  const [lighthouseHistory, setLighthouseHistory] = React.useState([]);
  const [historyLoaded, setHistoryLoaded] = React.useState(false);
  const [currentLevel, setCurrentLevel] = React.useState(1);
  const [levelUpdated, setLevelUpdated] = React.useState(false);

  const [contextswitchHistory, setContextswitchHistory] = React.useState([]);
  const [csHistoryLoaded, setCsHistoryLoaded] = React.useState(false);

  React.useEffect(() => {
    if (exercise?.id === 'lighthouse-watch') {
      AsyncStorage.getItem('cognify:lighthouse:sessions').then((storedStr) => {
        if (storedStr) {
          try {
            const parsed = JSON.parse(storedStr);
            setLighthouseHistory(parsed);
          } catch (e) {
            setLighthouseHistory([]);
          }
        }
        setHistoryLoaded(true);
      });
      AsyncStorage.getItem('cognify:gameLevel:lighthouse-watch').then((val) => {
        if (val) {
          setCurrentLevel(parseInt(val, 10));
        }
      });
    } else if (exercise?.id === 'context-switch') {
      AsyncStorage.getItem('cognify:contextswitch:sessions').then((storedStr) => {
        if (storedStr) {
          try {
            const parsed = JSON.parse(storedStr);
            setContextswitchHistory(parsed);
          } catch (e) {
            setContextswitchHistory([]);
          }
        }
        setCsHistoryLoaded(true);
      });
      AsyncStorage.getItem('cognify:gameLevel:context-switch').then((val) => {
        if (val) {
          setCurrentLevel(parseInt(val, 10));
        }
      });
    }
  }, [exercise?.id]);

  React.useEffect(() => {
    if (exercise?.id === 'signal-chain') {
      const currentBest = gameSpecificMetrics.bestSequence || 0;
      AsyncStorage.getItem('cognify:signalChain:bestSequence').then((val) => {
        const storedBest = val ? parseInt(val, 10) : 0;
        setAllTimeBestSequence(storedBest);
        setHasLoadedBest(true);

        // Every first session is technically a personal best (if currentBest >= 3)
        const isPB = storedBest === 0 ? currentBest >= 3 : currentBest > storedBest;

        if (isPB) {
          setIsNewPersonalBest(true);
          AsyncStorage.setItem('cognify:signalChain:bestSequence', String(currentBest));
          
          Animated.sequence([
            Animated.timing(celebrationPulse, {
              toValue: 1.2,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(celebrationPulse, {
              toValue: 1.0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    }
  }, [exercise?.id, gameSpecificMetrics.bestSequence]);

  const [allTimeBestRT, setAllTimeBestRT] = React.useState(null);
  const [isNewPersonalBestRT, setIsNewPersonalBestRT] = React.useState(false);
  const [hasLoadedBestRT, setHasLoadedBestRT] = React.useState(false);
  const celebrationPulseRT = React.useRef(new Animated.Value(1.0)).current;

  React.useEffect(() => {
    if (exercise?.id === 'flash-sort') {
      const currentFastest = gameSpecificMetrics.fastestRT || 0;
      AsyncStorage.getItem('cognify:flashSort:bestRT').then((val) => {
        const storedBest = val ? parseInt(val, 10) : null;
        setAllTimeBestRT(storedBest);
        setHasLoadedBestRT(true);

        const isPB = storedBest === null ? currentFastest > 0 : (currentFastest > 0 && currentFastest < storedBest);

        if (isPB) {
          setIsNewPersonalBestRT(true);
          AsyncStorage.setItem('cognify:flashSort:bestRT', String(currentFastest));
          
          Animated.sequence([
            Animated.timing(celebrationPulseRT, {
              toValue: 1.2,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(celebrationPulseRT, {
              toValue: 1.0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    }
  }, [exercise?.id, gameSpecificMetrics.fastestRT]);

  const [prevMeanRT, setPrevMeanRT] = React.useState(null);

  React.useEffect(() => {
    if (exercise?.id === 'flash-sort') {
      const currentMean = gameSpecificMetrics.meanReactionTime || 0;
      AsyncStorage.getItem('cognify:previousMeanRT:flash_sort').then((val) => {
        const storedPrev = val ? parseInt(val, 10) : null;
        setPrevMeanRT(storedPrev);
        AsyncStorage.setItem('cognify:previousMeanRT:flash_sort', String(currentMean));
      });
    }
  }, [exercise?.id, gameSpecificMetrics.meanReactionTime]);

  // Score comparison colour logic
  let scoreColor = Colors.textMuted;
  let scoreDeltaText = t('train.results.delta.firstSession');
  
  if (prevScore !== null && prevScore !== undefined) {
    const delta = score - prevScore;
    if (delta > 0) {
      scoreColor = Colors.positive;
      scoreDeltaText = t('train.results.delta.positive', { delta });
    } else if (delta < 0) {
      scoreColor = Colors.coral;
      scoreDeltaText = t('train.results.delta.negative', { delta });
    } else {
      scoreColor = Colors.textMuted;
      scoreDeltaText = t('train.results.delta.equal');
    }
  } else {
    scoreDeltaText = t('train.results.delta.firstSession');
  }

  const handlePrimaryCTA = () => {
    if (remainingExercises && remainingExercises.length > 0) {
      const nextEx = remainingExercises[0];
      const nextRemaining = remainingExercises.slice(1);
      
      // Safely navigate back to the Train tab root with parameters for the next exercise.
      // This closes the entire modal stack cleanly first.
      navigation.navigate('TrainRoot', {
        nextExercise: nextEx,
        remainingExercises: nextRemaining,
      });
    } else {
      // Return to main Train screen by popping the modal stack
      navigation.navigate('TrainRoot');
    }
  };

  const handleSecondaryCTA = () => {
    const exerciseToPlay = exercise;
    
    // Safely navigate back to the Train tab root with play again parameters.
    // This closes the entire modal stack cleanly first.
    navigation.navigate('TrainRoot', {
      playAgainExercise: exerciseToPlay,
    });
  };

  // Render game-specific metrics
  const renderGameSpecificMetrics = () => {
    if (!exercise) return null;

    switch (exercise.id) {
      case 'flash-sort': {
        const meanRt = gameSpecificMetrics.meanReactionTime || 0;
        return (
          <View style={styles.metricRow}>
            <Zap size={20} color={domain?.color.main} />
            <Text style={styles.metricLabel}>{t('train.results.meanReactionTime') || 'average reaction time:'}</Text>
            <Text style={[styles.metricValue, { color: domain?.color.main }]}>{meanRt}ms</Text>
          </View>
        );
      }
      case 'lighthouse-watch': {
        const hits = gameSpecificMetrics.hits || 0;
        const misses = gameSpecificMetrics.misses || 0;
        const falseAlarms = gameSpecificMetrics.falseAlarms || 0;
        const totalTargets = hits + misses;
        const hitRate = totalTargets > 0 ? Math.round((hits / totalTargets) * 100) : 0;
        // FArate: totalDistractors is usually total rounds minus total targets
        const totalRounds = roundsCompleted || 1;
        const totalDistractors = Math.max(1, totalRounds - totalTargets);
        const FArate = Math.round((falseAlarms / totalDistractors) * 100);

        return (
          <View style={styles.gameSpecificContainer}>
            <View style={styles.metricRow}>
              <Target size={20} color={domain?.color.main} />
              <Text style={styles.metricLabel}>{t('train.results.hitRate') || 'hit rate:'}</Text>
              <Text style={[styles.metricValue, { color: domain?.color.main }]}>{hitRate}%</Text>
            </View>
            <View style={styles.metricRow}>
              <Award size={20} color={domain?.color.main} />
              <Text style={styles.metricLabel}>{t('train.results.falseAlarmRate') || 'false alarm rate:'}</Text>
              <Text style={[styles.metricValue, { color: domain?.color.main }]}>{FArate}%</Text>
            </View>
            <View style={styles.metricRow}>
              <Flame size={20} color={domain?.color.main} />
              <Text style={styles.metricLabel}>{t('train.results.misses') || 'misses:'}</Text>
              <Text style={[styles.metricValue, { color: domain?.color.main }]}>{misses}</Text>
            </View>
          </View>
        );
      }
      case 'context-switch': {
        const switchCost = gameSpecificMetrics.switchCost || 0;
        return (
          <View style={styles.gameSpecificContainer}>
            <View style={styles.metricRow}>
              <CornerDownLeft size={20} color={domain?.color.main} />
              <Text style={styles.metricLabel}>{t('train.results.switchCost') || 'switch cost:'}</Text>
              <Text style={[styles.metricValue, { color: domain?.color.main }]}>{switchCost}ms</Text>
            </View>
            <Text style={styles.captionSubtext}>(lower is better)</Text>
          </View>
        );
      }
      case 'pattern-fold': {
        const mirrorErrors = gameSpecificMetrics.mirrorErrors || 0;
        return (
          <View style={styles.metricRow}>
            <CornerDownLeft size={20} color={domain?.color.main} />
            <Text style={styles.metricLabel}>{t('train.results.mirrorErrors') || 'mirror errors:'}</Text>
            <Text style={[styles.metricValue, { color: domain?.color.main }]}>{mirrorErrors}</Text>
          </View>
        );
      }
      default:
        return null;
    }
  };

  const getReactionTimeBenchmark = (meanRt) => {
    if (meanRt <= 250) return t('train.results.benchmark.elite');
    if (meanRt <= 350) return t('train.results.benchmark.great');
    if (meanRt <= 450) return t('train.results.benchmark.good');
    if (meanRt <= 600) return t('train.results.benchmark.average');
    return t('train.results.benchmark.train');
  };

  if (exercise?.id === 'pattern-fold') {
    return (
      <PatternFoldResults
        score={score}
        roundsCompleted={roundsCompleted}
        accuracy={accuracy}
        longestStreak={longestStreak}
        gameSpecificMetrics={gameSpecificMetrics}
        Colors={Colors}
        navigation={navigation}
        remainingExercises={remainingExercises}
        handlePrimaryCTA={handlePrimaryCTA}
        handleSecondaryCTA={handleSecondaryCTA}
      />
    );
  }

  if (exercise?.id === 'flash-sort') {
    const currentMean = gameSpecificMetrics.meanReactionTime || 0;
    
    let rtDeltaText = t('train.results.rtDelta.firstSession');
    let rtDeltaColor = Colors.textMuted;
    if (prevMeanRT !== null && prevMeanRT !== undefined) {
      const rtDelta = currentMean - prevMeanRT;
      if (rtDelta < 0) {
        rtDeltaColor = Colors.positive;
        rtDeltaText = t('train.results.rtDelta.negative', { rtDelta: Math.abs(rtDelta) });
      } else if (rtDelta > 0) {
        rtDeltaColor = Colors.coral;
        rtDeltaText = t('train.results.rtDelta.positive', { rtDelta: Math.abs(rtDelta) });
      } else {
        rtDeltaColor = Colors.textMuted;
        rtDeltaText = t('train.results.rtDelta.equal');
      }
    }

    const benchmarkLabel = getReactionTimeBenchmark(currentMean);

    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing[8], paddingBottom: insets.bottom + Spacing[8] }]}>
        <View style={styles.header}>
          <View style={[styles.domainChip, { backgroundColor: domain?.color.light }]}>
            <Text style={[styles.domainChipText, { color: domain?.color.main }]}>{domain?.label}</Text>
          </View>
          <Text style={styles.exerciseName}>{exercise?.name}</Text>
          {gameSpecificMetrics.sessionEndedEarly && (
            <Text style={styles.earlyExitNote}>{t('train.results.sessionEndedEarly')}</Text>
          )}
        </View>

        {/* Horizontal Large Stats Row */}
        <View style={styles.largeStatsRow}>
          {/* Stat 1: Mean Reaction Time */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: domain?.color.main }]}>
            <Text style={[styles.largeStatVal, { color: domain?.color.main }]}>
              {currentMean}ms
            </Text>
            <Text style={styles.largeStatLabel}>{t('train.results.meanReactionTime')}</Text>
            <Text style={[styles.largeStatDelta, { color: rtDeltaColor }]}>{rtDeltaText}</Text>
          </View>

          {/* Stat 2: Best Reaction Time */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: Colors.brandPrimary || '#F4A041' }]}>
            <Text style={[styles.largeStatVal, { color: Colors.brandPrimary || '#F4A041' }]}>
              {gameSpecificMetrics.fastestRT || 0}ms
            </Text>
            <Text style={styles.largeStatLabel}>{t('train.results.fastestResponse')}</Text>
            {isNewPersonalBestRT && (
              <View style={[styles.pbBadge, { backgroundColor: Colors.brandPrimary || '#F4A041' }]}>
                <Text style={styles.pbBadgeText}>{t('onboarding.intent.pb')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Best Callout */}
        {isNewPersonalBestRT && (
          <Animated.View style={[
            styles.pbCalloutCard,
            Shadow.md,
            {
              transform: [{ scale: celebrationPulseRT }],
              backgroundColor: 'rgba(255, 122, 0, 0.08)',
              borderColor: Colors.brandPrimary || '#F4A041',
            }
          ]}>
            <Award size={24} color={Colors.brandPrimary || '#F4A041'} />
            <Text style={[styles.pbCalloutText, { color: Colors.brandPrimary || '#F4A041' }]}>
              {t('train.results.pbCalloutRT', { rt: gameSpecificMetrics.fastestRT || 0 })}
            </Text>
          </Animated.View>
        )}

        {/* Contextual Benchmark Callout */}
        <View style={[styles.pbCalloutCard, Shadow.sm, { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1 }]}>
          <Text style={[styles.pbCalloutText, { color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
            {t('train.results.benchmarkCallout', { rt: currentMean, benchmark: benchmarkLabel })}
          </Text>
        </View>

        {/* 2x2 Grid of Stats 3–6 */}
        <View style={styles.statsGrid}>
          <View style={styles.gridRow}>
            {/* Stat 3: Accuracy */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{accuracy}%</Text>
              <Text style={styles.gridCardLabel}>{t('train.results.accuracy')}</Text>
            </View>

            {/* Stat 4: Rounds completed */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{roundsCompleted} {t('train.activeSession.rounds').toLowerCase()}</Text>
              <Text style={styles.gridCardLabel}>{t('train.results.roundsCompleted')}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Stat 5: Difficulty reached */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={[styles.gridCardVal, { fontSize: 15 }]}>{gameSpecificMetrics.difficultyReached || 'easy'}</Text>
              <Text style={styles.gridCardLabel}>{t('train.results.difficultyReached')}</Text>
            </View>

            {/* Stat 6: Longest streak */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{t('train.results.streakInRow', { streak: longestStreak })}</Text>
              <Text style={styles.gridCardLabel}>{t('train.results.bestStreak')}</Text>
            </View>
          </View>
        </View>

        {/* Raw Score Indicator Card */}
        <View style={[styles.pbCalloutCard, Shadow.sm, { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, justifyContent: 'center' }]}>
          <Text style={{ fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary }}>
            {t('train.results.sessionScoreLabel', { score: score.toLocaleString() })}
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.brandPrimary }]}
            onPress={handlePrimaryCTA}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {remainingExercises && remainingExercises.length > 0
                ? (t('train.results.nextExercise') || 'next exercise')
                : (t('train.results.done') || 'done')}
            </Text>
            {remainingExercises && remainingExercises.length > 0 && (
              <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: Spacing[2] }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSecondaryCTA}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>
              {t('train.results.playAgain') || 'play again'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (exercise?.id === 'lighthouse-watch') {
    const hits = gameSpecificMetrics.hits || 0;
    const misses = gameSpecificMetrics.misses || 0;
    const falseAlarms = gameSpecificMetrics.falseAlarms || 0;
    const totalTargets = hits + misses;
    const hitRate = totalTargets > 0 ? Math.round((hits / totalTargets) * 100) : 0;
    const totalRounds = roundsCompleted || 1;
    const totalDistractors = Math.max(1, totalRounds - totalTargets);
    const FArate = Math.round((falseAlarms / totalDistractors) * 100);

    let benchmarkLabel = 'Steady Progress';
    let benchmarkDesc = 'Keep training to improve your sustained vigilance and focus.';
    if (hitRate >= 90 && FArate <= 10) {
      benchmarkLabel = 'Elite Vigilance';
      benchmarkDesc = 'Flawless target detection and stellar impulse control. Elite performance!';
    } else if (hitRate >= 80 && FArate <= 15) {
      benchmarkLabel = 'Strong Focus';
      benchmarkDesc = 'Excellent attention span with very few false alarms. Well done!';
    } else if (hitRate >= 70 && FArate <= 25) {
      benchmarkLabel = 'Consistent Attention';
      benchmarkDesc = 'Solid vigilance with a steady hand. Keep refining your focus!';
    }

    // Continuity corrected D-Prime calculation
    let correctedHits = hits;
    if (hits === totalTargets) {
      correctedHits = totalTargets - 0.5;
    } else if (hits === 0) {
      correctedHits = 0.5;
    }
    let correctedFalseAlarms = falseAlarms;
    if (falseAlarms === totalDistractors) {
      correctedFalseAlarms = totalDistractors - 0.5;
    } else if (falseAlarms === 0) {
      correctedFalseAlarms = 0.5;
    }

    const hitRateRatio = totalTargets > 0 ? correctedHits / totalTargets : 0.5;
    const faRateRatio = totalDistractors > 0 ? correctedFalseAlarms / totalDistractors : 0.5;
    const dPrime = getZScore(hitRateRatio) - getZScore(faRateRatio);

    // Quartiles analysis for Heatmap & Patterns
    const quartiles = gameSpecificMetrics.quartiles || [
      { q: 0, hits: 0, misses: 0, falseAlarms: 0 },
      { q: 1, hits: 0, misses: 0, falseAlarms: 0 },
      { q: 2, hits: 0, misses: 0, falseAlarms: 0 },
      { q: 3, hits: 0, misses: 0, falseAlarms: 0 }
    ];

    let detectedPattern = 'STEADY_FOCUS';
    let patternTitle = 'steady concentration';
    let patternDesc = 'you maintained steady focus and guarded against unnecessary distraction triggers.';
    let patternColor = '#3DAB7F'; // Green

    const q1FAs = quartiles[0]?.falseAlarms || 0;
    const q4FAs = quartiles[3]?.falseAlarms || 0;
    const totalMissRate = totalTargets > 0 ? misses / totalTargets : 0;

    if (hits / Math.max(1, totalTargets) > 0.9 && falseAlarms / Math.max(1, totalDistractors) < 0.1) {
      detectedPattern = 'PEAK_PERFORMANCE';
      patternTitle = 'elite vigilance';
      patternDesc = 'flawless target detection and exceptional impulse control. vigilance tier peak achieved!';
      patternColor = '#A662C6'; // Purple
    } else if (q4FAs > q1FAs * 2 && q4FAs >= 2) {
      detectedPattern = 'LATE_FATIGUE';
      patternTitle = 'late session fatigue';
      patternDesc = 'your false alarm rate spikes in the final stretch, indicating a classic vigilance decrement. take a deep breath before playing next time!';
      patternColor = '#BA7517'; // Amber
    } else if (q1FAs >= 3) {
      detectedPattern = 'EARLY_IMPULSIVITY';
      patternTitle = 'early impulsivity';
      patternDesc = 'you tapped too quickly at the very beginning of the session. slow down and wait for the shape to clearly resolve.';
      patternColor = '#E24B4A'; // Red
    } else if (totalMissRate > 0.4) {
      detectedPattern = 'CONSISTENT_MISS';
      patternTitle = 'high speed overload';
      patternDesc = 'you missed more than 40% of the stars. the stream might be moving too fast — try playing at a lower level to build baseline focus.';
      patternColor = '#BA7517'; // Amber
    }

    // Adaptive LEVEL prompting logic
    const allSessionsForAdaptive = [...lighthouseHistory];
    const existsCurrent = allSessionsForAdaptive.some(s => s.score === score && Math.abs(new Date(s.timestamp) - new Date()) < 60000);
    if (!existsCurrent) {
      allSessionsForAdaptive.unshift({
        hits,
        misses,
        falseAlarms,
        totalTargets,
        totalDistractors,
        level: currentLevel,
      });
    }

    let adaptivePrompt = null;
    let targetLevel = 1;

    if (allSessionsForAdaptive.length >= 3) {
      const last3 = allSessionsForAdaptive.slice(0, 3);
      const hitRateAvg = last3.reduce((sum, s) => sum + (s.hits / Math.max(1, s.totalTargets || (s.hits + s.misses || 1))), 0) / 3;
      const faRateAvg = last3.reduce((sum, s) => sum + (s.falseAlarms / Math.max(1, s.totalDistractors || 1)), 0) / 3;
      
      if (hitRateAvg > 0.85 && faRateAvg < 0.12) {
        const curLvl = last3[0].level || currentLevel;
        if (curLvl < 5) {
          adaptivePrompt = 'up';
          targetLevel = curLvl + 1;
        }
      }
    }

    if (!adaptivePrompt && allSessionsForAdaptive.length >= 2) {
      const last2 = allSessionsForAdaptive.slice(0, 2);
      const hitRateAvg2 = last2.reduce((sum, s) => sum + (s.hits / Math.max(1, s.totalTargets || (s.hits + s.misses || 1))), 0) / 2;
      const faRateAvg2 = last2.reduce((sum, s) => sum + (s.falseAlarms / Math.max(1, s.totalDistractors || 1)), 0) / 2;

      if (faRateAvg2 > 0.35 || hitRateAvg2 < 0.50) {
        const curLvl = last2[0].level || currentLevel;
        if (curLvl > 1) {
          adaptivePrompt = 'down';
          targetLevel = curLvl - 1;
        }
      }
    }

    const handleApplyAdaptiveLevel = async () => {
      try {
        await AsyncStorage.setItem('cognify:gameLevel:lighthouse-watch', String(targetLevel));
        setCurrentLevel(targetLevel);
        setLevelUpdated(true);
      } catch (e) {
        console.error('[SessionResultScreen] Error updating level:', e);
      }
    };

    // Render Sparkline path helper
    const renderSparkline = () => {
      const trendSessions = allSessionsForAdaptive.slice(0, 7).reverse();
      if (trendSessions.length < 2) {
        return (
          <Text style={styles.trendEmptyText}>
            play 2 more sessions to unlock your sustained vigilance trend graph.
          </Text>
        );
      }

      const points = trendSessions.map((s, idx) => {
        const val = s.dPrime !== undefined ? s.dPrime : 1.5;
        const x = (idx / (trendSessions.length - 1)) * 260 + 20;
        const y = 50 - (Math.max(0, Math.min(4.0, val)) / 4.0) * 35;
        return { x, y };
      });

      const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

      return (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Svg width="100%" height={60} viewBox="0 0 300 60">
            <Path
              d={pathD}
              fill="none"
              stroke={domain?.color.main}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, idx) => (
              <Circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={Colors.appBg}
                stroke={domain?.color.main}
                strokeWidth={2}
              />
            ))}
          </Svg>
        </View>
      );
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing[8], paddingBottom: insets.bottom + Spacing[8] }]}>
        <View style={styles.header}>
          <View style={[styles.domainChip, { backgroundColor: domain?.color.light }]}>
            <Text style={[styles.domainChipText, { color: domain?.color.main }]}>{domain?.label}</Text>
          </View>
          <Text style={styles.exerciseName}>{exercise?.name}</Text>
          {gameSpecificMetrics.sessionEndedEarly && (
            <Text style={styles.earlyExitNote}>{t('train.results.sessionEndedEarly')}</Text>
          )}
        </View>

        {/* Horizontal Large Stats Row */}
        <View style={styles.largeStatsRow}>
          {/* Stat 1: Session score */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: domain?.color.main }]}>
            <Text style={[styles.largeStatVal, { color: domain?.color.main }]}>
              {score.toLocaleString()}
            </Text>
            <Text style={styles.largeStatLabel}>{t('train.results.sessionScore')}</Text>
            <Text style={[styles.largeStatDelta, { color: scoreColor }]}>{scoreDeltaText}</Text>
          </View>

          {/* Stat 2: Vigilance Index */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: '#A662C6' }]}>
            <Text style={[styles.largeStatVal, { color: '#A662C6' }]}>
              {dPrime.toFixed(2)}
            </Text>
            <Text style={styles.largeStatLabel}>{t('train.results.vigilanceIndex')}</Text>
          </View>
        </View>

        {/* Adaptive Level Suggestion Banner */}
        {adaptivePrompt && (
          <View style={[styles.adaptiveBanner, { backgroundColor: Colors.surface, borderColor: adaptivePrompt === 'up' ? '#3DAB7F' : '#E24B4A' }]}>
            <View style={styles.adaptiveHeader}>
              <Text style={[styles.adaptiveTitle, { color: adaptivePrompt === 'up' ? '#3DAB7F' : '#E24B4A' }]}>
                {adaptivePrompt === 'up' ? t('train.results.adaptive.levelUp') : t('train.results.adaptive.levelDown')}
              </Text>
              <Text style={{ fontSize: 10, color: Colors.textMuted }}>{t('train.results.adaptiveLabel')}</Text>
            </View>
            <Text style={styles.adaptiveDesc}>
              {adaptivePrompt === 'up' 
                ? t('train.results.adaptive.descUp', { prevLevel: targetLevel - 1, nextLevel: targetLevel })
                : t('train.results.adaptive.descDown', { prevLevel: targetLevel + 1, nextLevel: targetLevel })}
            </Text>
            
            {levelUpdated ? (
              <Text style={[styles.adaptiveSuccessText, { color: '#3DAB7F' }]}>{t('train.results.adaptive.success', { level: targetLevel })}</Text>
            ) : (
              <View style={styles.adaptiveActions}>
                <TouchableOpacity
                  style={[styles.adaptiveBtnGo, { backgroundColor: adaptivePrompt === 'up' ? '#3DAB7F' : '#E24B4A' }]}
                  onPress={handleApplyAdaptiveLevel}
                >
                  <Text style={[styles.adaptiveBtnGoText, { color: Colors.textInverse }]}>{t('train.results.adaptive.go')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.adaptiveBtnNo, { borderColor: Colors.border }]}
                  onPress={() => setLevelUpdated(true)}
                >
                  <Text style={[styles.adaptiveBtnNoText, { color: Colors.textSecondary }]}>{t('train.results.adaptive.no')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Contextual Cognitive Insight Card */}
        <View style={[styles.pbCalloutCard, Shadow.sm, { backgroundColor: Colors.surface, borderColor: patternColor, borderLeftWidth: 4 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pbCalloutText, { color: patternColor }]}>
              {t('train.results.pattern.label', { pattern: t('train.results.pattern.title.' + toCamelCase(detectedPattern)) })}
            </Text>
            <Text style={{ fontSize: Typography.size.caption, color: Colors.textSecondary, marginTop: 4 }}>
              {t('train.results.pattern.desc.' + toCamelCase(detectedPattern))}
            </Text>
          </View>
        </View>

        {/* 15-Second Quartile Heatmap */}
        <View style={{ width: '100%', marginVertical: Spacing[2] }}>
          <Text style={styles.heatmapSectionTitle}>{t('train.results.heatmapTitle')}</Text>
          <View style={styles.heatmapRow}>
            {quartiles.map((q, idx) => {
              const errors = q.misses + q.falseAlarms;
              const bg = errors === 0 
                ? 'rgba(61, 171, 127, 0.08)' 
                : errors <= 2 
                  ? 'rgba(186, 117, 23, 0.08)' 
                  : 'rgba(226, 75, 74, 0.08)';
              const border = errors === 0 
                ? '#3DAB7F' 
                : errors <= 2 
                  ? '#BA7517' 
                  : '#E24B4A';
              const textCol = errors === 0 
                ? '#3DAB7F' 
                : errors <= 2 
                  ? '#BA7517' 
                  : '#E24B4A';
              
              return (
                <View key={idx} style={[styles.heatmapBlock, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={styles.heatmapBlockTitle}>{idx * 15}-{ (idx + 1) * 15 }s</Text>
                  <Text style={styles.heatmapBlockVal}>{q.hits}✓</Text>
                  <Text style={[styles.heatmapBlockSub, { color: textCol }]}>{errors}✗</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 7-Session D-Prime Trend Chart */}
        <View style={[styles.trendCard, Shadow.sm]}>
          <Text style={styles.trendTitle}>{t('train.results.trendTitle')}</Text>
          {renderSparkline()}
        </View>

        {/* 3-Axis Vigilance Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.gridRow}>
            {/* Hit Rate */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{hitRate}%</Text>
              <Text style={styles.gridCardLabel}>{t('train.results.hitRate')}</Text>
            </View>

            {/* False Alarm Rate */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{FArate}%</Text>
              <Text style={styles.gridCardLabel}>{t('train.results.falseAlarmRate')}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Misses */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{misses}</Text>
              <Text style={styles.gridCardLabel}>{t('train.results.totalMisses')}</Text>
            </View>

            {/* Total Rounds */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{roundsCompleted}</Text>
              <Text style={styles.gridCardLabel}>{t('train.results.totalStimuli')}</Text>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.brandPrimary }]}
            onPress={handlePrimaryCTA}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {remainingExercises && remainingExercises.length > 0
                ? (t('train.results.nextExercise') || 'next exercise')
                : (t('train.results.done') || 'done')}
            </Text>
            {remainingExercises && remainingExercises.length > 0 && (
              <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: Spacing[2] }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSecondaryCTA}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>
              {t('train.results.playAgain') || 'play again'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (exercise?.id === 'context-switch') {
    const rounds = gameSpecificMetrics.rounds || [];
    const switchCostMs = gameSpecificMetrics.switchCostMs !== undefined ? gameSpecificMetrics.switchCostMs : 0;
    
    const switchRounds = rounds.filter(r => r.isSwitch);
    const stayRounds = rounds.filter(r => !r.isSwitch);
    const correctSwitches = switchRounds.filter(r => r.correct).length;
    const correctStays = stayRounds.filter(r => r.correct).length;
    const switchAccuracy = switchRounds.length ? Math.round((correctSwitches / switchRounds.length) * 100) : 0;
    const stayAccuracy = stayRounds.length ? Math.round((correctStays / stayRounds.length) * 100) : 0;

    const ruleStats = gameSpecificMetrics.ruleStats || {
      shape: { attempts: 0, correct: 0, avgRTms: 0, switchCostMs: 0 },
      color: { attempts: 0, correct: 0, avgRTms: 0, switchCostMs: 0 },
      size: { attempts: 0, correct: 0, avgRTms: 0, switchCostMs: 0 },
      count: { attempts: 0, correct: 0, avgRTms: 0, switchCostMs: 0 }
    };

    const totalRounds = roundsCompleted || 1;
    const timeoutCount = rounds.filter(r => r.timedOut).length;
    const timeoutRate = totalRounds > 0 ? timeoutCount / totalRounds : 0;

    let switchCostDeltaText = 'first session';
    let switchCostColor = Colors.textMuted;
    if (contextswitchHistory.length >= 2) {
      const prevSession = contextswitchHistory[1];
      if (prevSession && prevSession.switchCostMs !== undefined) {
        const delta = switchCostMs - prevSession.switchCostMs;
        if (delta < 0) {
          switchCostDeltaText = `↓${Math.abs(delta)}ms from last session`;
          switchCostColor = '#3DAB7F';
        } else if (delta > 0) {
          switchCostDeltaText = `↑${delta}ms from last session`;
          switchCostColor = '#E24B4A';
        } else {
          switchCostDeltaText = 'equal to last session';
          switchCostColor = Colors.textSecondary;
        }
      }
    }

    let detectedPattern = 'STEADY_FOCUS';
    let patternTitle = 'steady concentration';
    let patternDesc = 'you maintained steady focus and successfully navigated rule transitions.';
    let patternColor = '#3DAB7F';

    const ruleAccs = Object.entries(ruleStats).map(([rule, s]) => ({ rule, acc: s.attempts > 0 ? s.correct / s.attempts : 0.8 }));
    const weakRule = ruleAccs.find(r => r.acc < 0.65 && ruleAccs.filter(x => x.acc > 0.8).length >= 2);

    if (switchCostMs !== null && switchCostMs < 50) {
      detectedPattern = 'ELITE_FLEXIBILITY';
      patternTitle = 'elite flexibility';
      patternDesc = 'your switch cost is incredibly low. you are shifting gears almost instantly. elite executive control!';
      patternColor = '#A662C6';
    } else if (weakRule) {
      detectedPattern = 'WEAK_RULE';
      patternTitle = `asymmetric set-shifting: ${weakRule.rule}`;
      patternDesc = `your accuracy on ${weakRule.rule.toUpperCase()} transitions is significantly lower than other rules. focus on the colored border before tapping!`;
      patternColor = '#BA7517';
    } else if (timeoutRate > 0.20) {
      detectedPattern = 'TIMEOUT_SPIKE';
      patternTitle = 'cognitive overload';
      patternDesc = 'your timeout rate exceeded 20%. the response window may be too tight for this level. take a brief breath between trials.';
      patternColor = '#E24B4A';
    } else if (stayAccuracy > 0.95 && switchAccuracy < 0.70) {
      detectedPattern = 'STAY_DOMINANT';
      patternTitle = 'rule-switching deficit';
      patternDesc = 'you are highly precise on stay rounds but struggle to load new rules. try slowing down slightly on switch borders.';
      patternColor = '#BA7517';
    }

    const allSessionsForCS = [...contextswitchHistory];
    const existsCSCurrent = allSessionsForCS.some(s => s.score === score && Math.abs(new Date(s.timestamp) - new Date()) < 60000);
    if (!existsCSCurrent) {
      allSessionsForCS.unshift({
        score,
        completedRounds: totalRounds,
        switchAccuracy,
        timeoutRate,
        level: currentLevel,
      });
    }

    let adaptivePrompt = null;
    let targetLevel = 1;

    if (allSessionsForCS.length >= 3) {
      const last3 = allSessionsForCS.slice(0, 3);
      const switchAccAvg = last3.reduce((sum, s) => sum + (s.switchAccuracy || 0), 0) / 3;
      const timeoutRateAvg = last3.reduce((sum, s) => sum + (s.timeoutRate || 0), 0) / 3;
      
      if (switchAccAvg > 88 && timeoutRateAvg < 0.08) {
        const curLvl = last3[0].level || currentLevel;
        if (curLvl < 5) {
          adaptivePrompt = 'up';
          targetLevel = curLvl + 1;
        }
      }
    }

    if (!adaptivePrompt && allSessionsForCS.length >= 2) {
      const last2 = allSessionsForCS.slice(0, 2);
      const switchAccAvg2 = last2.reduce((sum, s) => sum + (s.switchAccuracy || 0), 0) / 2;
      const timeoutRateAvg2 = last2.reduce((sum, s) => sum + (s.timeoutRate || 0), 0) / 2;

      if (switchAccAvg2 < 55 || timeoutRateAvg2 > 0.25) {
        const curLvl = last2[0].level || currentLevel;
        if (curLvl > 1) {
          adaptivePrompt = 'down';
          targetLevel = curLvl - 1;
        }
      }
    }

    const handleApplyAdaptiveLevel = async () => {
      try {
        const key = exercise?.id === 'context-switch' 
          ? 'cognify:gameLevel:context-switch' 
          : 'cognify:gameLevel:lighthouse-watch';
        await AsyncStorage.setItem(key, String(targetLevel));
        setCurrentLevel(targetLevel);
        setLevelUpdated(true);
      } catch (e) {
        console.error('[SessionResultScreen] Error updating level:', e);
      }
    };

    const renderCSSparkline = () => {
      const trendSessions = allSessionsForCS.slice(0, 7).reverse();
      if (trendSessions.length < 2) {
        return (
          <Text style={styles.trendEmptyText}>
            play 2 more sessions to unlock your sustained vigilance trend graph.
          </Text>
        );
      }

      const points = trendSessions.map((s, idx) => {
        const val = s.switchCostMs !== undefined ? s.switchCostMs : 150;
        const x = (idx / (trendSessions.length - 1)) * 260 + 20;
        const boundedVal = Math.max(-100, Math.min(500, val));
        const y = 50 - ((boundedVal + 100) / 600) * 35;
        return { x, y };
      });

      const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

      return (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Svg width="100%" height={60} viewBox="0 0 300 60">
            <Path
              d={pathD}
              fill="none"
              stroke={domain?.color.main}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, idx) => (
              <Circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={Colors.appBg}
                stroke={domain?.color.main}
                strokeWidth={2}
              />
            ))}
          </Svg>
        </View>
      );
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing[8], paddingBottom: insets.bottom + Spacing[8] }]}>
        <View style={styles.header}>
          <View style={[styles.domainChip, { backgroundColor: domain?.color.light }]}>
            <Text style={[styles.domainChipText, { color: domain?.color.main }]}>{domain?.label}</Text>
          </View>
          <Text style={styles.exerciseName}>{exercise?.name}</Text>
          {gameSpecificMetrics.sessionEndedEarly && (
            <Text style={styles.earlyExitNote}>{t('train.results.sessionEndedEarly')}</Text>
          )}
        </View>

        {/* Horizontal Large Stats Row */}
        <View style={styles.largeStatsRow}>
          {/* Stat 1: Session score */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: domain?.color.main }]}>
            <Text style={[styles.largeStatVal, { color: domain?.color.main }]}>
              {score.toLocaleString()}
            </Text>
            <Text style={styles.largeStatLabel}>{t('train.results.sessionScore')}</Text>
            <Text style={[styles.largeStatDelta, { color: scoreColor }]}>{scoreDeltaText}</Text>
          </View>

          {/* Stat 2: Switch Cost */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: '#A662C6' }]}>
            <Text style={[styles.largeStatVal, { color: '#A662C6' }]}>
              {switchCostMs}ms
            </Text>
            <Text style={styles.largeStatLabel}>{t('train.results.switchCostRTDelta')}</Text>
            <Text style={[styles.largeStatDelta, { color: switchCostColor }]}>{switchCostDeltaText}</Text>
          </View>
        </View>

        {/* Adaptive Level Suggestion Banner */}
        {adaptivePrompt && (
          <View style={[styles.adaptiveBanner, { backgroundColor: Colors.surface, borderColor: adaptivePrompt === 'up' ? '#3DAB7F' : '#E24B4A' }]}>
            <View style={styles.adaptiveHeader}>
              <Text style={[styles.adaptiveTitle, { color: adaptivePrompt === 'up' ? '#3DAB7F' : '#E24B4A' }]}>
                {adaptivePrompt === 'up' ? t('train.results.adaptive.levelUp') : t('train.results.adaptive.levelDown')}
              </Text>
              <Text style={{ fontSize: 10, color: Colors.textMuted }}>{t('train.results.adaptiveLabel')}</Text>
            </View>
            <Text style={styles.adaptiveDesc}>
              {adaptivePrompt === 'up' 
                ? t('train.results.adaptive.descUp', { prevLevel: targetLevel - 1, nextLevel: targetLevel })
                : t('train.results.adaptive.descDown', { prevLevel: targetLevel + 1, nextLevel: targetLevel })}
            </Text>
            
            {levelUpdated ? (
              <Text style={[styles.adaptiveSuccessText, { color: '#3DAB7F' }]}>{t('train.results.adaptive.success', { level: targetLevel })}</Text>
            ) : (
              <View style={styles.adaptiveActions}>
                <TouchableOpacity
                  style={[styles.adaptiveBtnGo, { backgroundColor: adaptivePrompt === 'up' ? '#3DAB7F' : '#E24B4A' }]}
                  onPress={handleApplyAdaptiveLevel}
                >
                  <Text style={[styles.adaptiveBtnGoText, { color: Colors.textInverse }]}>{t('train.results.adaptive.go')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.adaptiveBtnNo, { borderColor: Colors.border }]}
                  onPress={() => setLevelUpdated(true)}
                >
                  <Text style={[styles.adaptiveBtnNoText, { color: Colors.textSecondary }]}>{t('train.results.adaptive.no')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Accuracy Pills */}
        <View style={styles.largeStatsRow}>
          <View style={[styles.largeStatCard, Shadow.sm, { minHeight: 70, padding: 12 }]}>
            <Text style={{ fontFamily: Typography.fontFamily.bold, fontSize: 20, color: '#3DAB7F' }}>{switchAccuracy}%</Text>
            <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{t('train.results.switchAccuracy')}</Text>
          </View>
          <View style={[styles.largeStatCard, Shadow.sm, { minHeight: 70, padding: 12 }]}>
            <Text style={{ fontFamily: Typography.fontFamily.bold, fontSize: 20, color: '#0073E6' }}>{stayAccuracy}%</Text>
            <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{t('train.results.stayAccuracy')}</Text>
          </View>
        </View>

        {/* Contextual Cognitive Insight Card */}
        <View style={[styles.pbCalloutCard, Shadow.sm, { backgroundColor: Colors.surface, borderColor: patternColor, borderLeftWidth: 4 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pbCalloutText, { color: patternColor }]}>
              {t('train.results.pattern.label.cs', { pattern: detectedPattern === 'WEAK_RULE' ? t('train.results.pattern.title.weakRule', { rule: weakRule.rule.toUpperCase() }) : t('train.results.pattern.title.' + toCamelCase(detectedPattern)) })}
            </Text>
            <Text style={{ fontSize: Typography.size.caption, color: Colors.textSecondary, marginTop: 4 }}>
              {detectedPattern === 'WEAK_RULE' ? t('train.results.pattern.desc.weakRule', { rule: weakRule.rule.toUpperCase() }) : t('train.results.pattern.desc.' + toCamelCase(detectedPattern))}
            </Text>
          </View>
        </View>

        {/* Rule Breakdown Strip */}
        <View style={{ width: '100%', marginVertical: Spacing[2] }}>
          <Text style={styles.heatmapSectionTitle}>{t('train.results.classificationBreakdown')}</Text>
          <View style={styles.heatmapRow}>
            {Object.entries(ruleStats).map(([rule, s]) => {
              const ruleAcc = s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : 100;
              const bg = ruleAcc >= 85 
                ? 'rgba(61, 171, 127, 0.08)' 
                : ruleAcc >= 70 
                  ? 'rgba(186, 117, 23, 0.08)' 
                  : 'rgba(226, 75, 74, 0.08)';
              const border = ruleAcc >= 85 ? '#3DAB7F' : ruleAcc >= 70 ? '#BA7517' : '#E24B4A';
              const textCol = ruleAcc >= 85 ? '#3DAB7F' : ruleAcc >= 70 ? '#BA7517' : '#E24B4A';
              
              return (
                <View key={rule} style={[styles.heatmapBlock, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={styles.heatmapBlockTitle}>{rule}</Text>
                  <Text style={styles.heatmapBlockVal}>{ruleAcc}%</Text>
                  <Text style={[styles.heatmapBlockSub, { color: textCol }]}>{t('train.results.trials', { count: s.attempts })}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 7-Session D-Prime Trend Chart */}
        <View style={[styles.trendCard, Shadow.sm]}>
          <Text style={styles.trendTitle}>{t('train.results.csTrendTitle')}</Text>
          {renderCSSparkline()}
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.brandPrimary }]}
            onPress={handlePrimaryCTA}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {remainingExercises && remainingExercises.length > 0
                ? (t('train.results.nextExercise') || 'next exercise')
                : (t('train.results.done') || 'done')}
            </Text>
            {remainingExercises && remainingExercises.length > 0 && (
              <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: Spacing[2] }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSecondaryCTA}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>
              {t('train.results.playAgain') || 'play again'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (exercise?.id === 'signal-chain') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing[8], paddingBottom: insets.bottom + Spacing[8] }]}>
        <View style={styles.header}>
          <View style={[styles.domainChip, { backgroundColor: domain?.color.light }]}>
            <Text style={[styles.domainChipText, { color: domain?.color.main }]}>{domain?.label}</Text>
          </View>
          <Text style={styles.exerciseName}>{exercise?.name}</Text>
          {gameSpecificMetrics.sessionEndedEarly && (
            <Text style={styles.earlyExitNote}>session ended early.</Text>
          )}
        </View>

        {/* Horizontal Large Stats Row */}
        <View style={styles.largeStatsRow}>
          {/* Stat 1: Session score */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: domain?.color.main }]}>
            <Text style={[styles.largeStatVal, { color: domain?.color.main }]}>
              {score.toLocaleString()}
            </Text>
            <Text style={styles.largeStatLabel}>session score</Text>
            <Text style={[styles.largeStatDelta, { color: scoreColor }]}>{scoreDeltaText}</Text>
          </View>

          {/* Stat 2: Best sequence */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: Colors.brandPrimary || '#F4A041' }]}>
            <Text style={[styles.largeStatVal, { color: Colors.brandPrimary || '#F4A041' }]}>
              {gameSpecificMetrics.bestSequence || 0}
            </Text>
            <Text style={styles.largeStatLabel}>best sequence</Text>
            {isNewPersonalBest && (
              <View style={[styles.pbBadge, { backgroundColor: Colors.brandPrimary || '#F4A041' }]}>
                <Text style={styles.pbBadgeText}>personal best</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Best Callout */}
        {isNewPersonalBest && (
          <Animated.View style={[
            styles.pbCalloutCard,
            Shadow.md,
            {
              transform: [{ scale: celebrationPulse }],
              backgroundColor: 'rgba(255, 122, 0, 0.08)',
              borderColor: Colors.brandPrimary || '#F4A041',
            }
          ]}>
            <Award size={24} color={Colors.brandPrimary || '#F4A041'} />
            <Text style={[styles.pbCalloutText, { color: Colors.brandPrimary || '#F4A041' }]}>
              new personal best — {gameSpecificMetrics.bestSequence || 0} nodes recalled!
            </Text>
          </Animated.View>
        )}

        {/* 2x2 Grid of Stats 3–6 */}
        <View style={styles.statsGrid}>
          <View style={styles.gridRow}>
            {/* Stat 3: Completion rate */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{accuracy}%</Text>
              <Text style={styles.gridCardLabel}>completion rate</Text>
            </View>

            {/* Stat 4: Avg per round */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{gameSpecificMetrics.avgPerRound || 0} pts</Text>
              <Text style={styles.gridCardLabel}>avg per round</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Stat 5: Difficulty reached */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={[styles.gridCardVal, { fontSize: 15 }]}>{gameSpecificMetrics.difficultyReached || 'easy'}</Text>
              <Text style={styles.gridCardLabel}>difficulty reached</Text>
            </View>

            {/* Stat 6: Longest streak */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{longestStreak} in a row</Text>
              <Text style={styles.gridCardLabel}>best streak</Text>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.brandPrimary }]}
            onPress={handlePrimaryCTA}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {remainingExercises && remainingExercises.length > 0
                ? (t('train.results.nextExercise') || 'next exercise')
                : (t('train.results.done') || 'done')}
            </Text>
            {remainingExercises && remainingExercises.length > 0 && (
              <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: Spacing[2] }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSecondaryCTA}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>
              {t('train.results.playAgain') || 'play again'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing[8], paddingBottom: insets.bottom + Spacing[8] }]}>
      <View style={styles.header}>
        <View style={[styles.domainChip, { backgroundColor: domain?.color.light }]}>
          <Text style={[styles.domainChipText, { color: domain?.color.main }]}>{domain?.label}</Text>
        </View>
        <Text style={styles.exerciseName}>{exercise?.name}</Text>
      </View>

      {/* Main Score Display Card */}
      <View style={[styles.scoreCard, Shadow.md]}>
        <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
        <Text style={[styles.scoreDelta, { color: scoreColor }]}>{scoreDeltaText}</Text>
      </View>

      {/* 5 Standard Metrics Checklist */}
      <View style={[styles.metricsList, Shadow.sm]}>
        <View style={styles.metricRow}>
          <Target size={20} color={Colors.textSecondary} />
          <Text style={styles.metricLabel}>{t('train.results.roundsCompleted') || 'rounds completed'}</Text>
          <Text style={styles.metricValue}>{roundsCompleted}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <Award size={20} color={Colors.textSecondary} />
          <Text style={styles.metricLabel}>{t('train.results.accuracy') || 'accuracy'}</Text>
          <Text style={styles.metricValue}>{accuracy}%</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <Flame size={20} color={Colors.textSecondary} />
          <Text style={styles.metricLabel}>{t('train.results.longestStreak') || 'longest streak'}</Text>
          <Text style={styles.metricValue}>{longestStreak} in a row</Text>
        </View>

        {/* Game-specific metrics section */}
        {renderGameSpecificMetrics() && (
          <>
            <View style={styles.divider} />
            {renderGameSpecificMetrics()}
          </>
        )}
      </View>

      {/* CTA Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: Colors.brandPrimary }]}
          onPress={handlePrimaryCTA}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {remainingExercises && remainingExercises.length > 0
              ? (t('train.results.nextExercise') || 'next exercise')
              : (t('train.results.done') || 'done')}
          </Text>
          {remainingExercises && remainingExercises.length > 0 && (
            <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: Spacing[2] }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSecondaryCTA}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>
            {t('train.results.playAgain') || 'play again'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  content: { paddingHorizontal: Spacing[6], alignItems: 'center', gap: Spacing[6] },
  
  header: { alignItems: 'center', gap: Spacing[2] },
  domainChip: { borderRadius: Radius.full, paddingHorizontal: Spacing[4], paddingVertical: Spacing[1] },
  domainChipText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.caption },
  exerciseName: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.h1, color: Colors.textPrimary },

  scoreCard: {
    backgroundColor: Colors.surface,
    width: '100%',
    borderRadius: Radius.xl,
    paddingVertical: Spacing[8],
    alignItems: 'center',
    gap: Spacing[2],
  },
  scoreNum: { fontFamily: Typography.fontFamily.extraBold, fontSize: 64, lineHeight: 72 },
  scoreDelta: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.body },

  metricsList: {
    backgroundColor: Colors.surface,
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing[5],
    gap: Spacing[4],
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  metricLabel: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    marginLeft: Spacing[3],
  },
  metricValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
  },
  gameSpecificContainer: {
    width: '100%',
    gap: Spacing[4],
  },
  captionSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: -Spacing[2],
  },

  actions: {
    width: '100%',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    paddingVertical: 18,
    width: '100%',
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
  },
  secondaryButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
  },
  earlyExitNote: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.coral || '#FF3B30',
    marginTop: Spacing[1],
    textAlign: 'center',
  },
  largeStatsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing[3],
  },
  largeStatCard: {
    flex: 1,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    minHeight: 110,
  },
  largeStatVal: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 32,
  },
  largeStatLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  largeStatDelta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    marginTop: 4,
  },
  pbBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pbBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.textInverse,
  },
  pbCalloutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing[3],
  },
  pbCalloutText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    flex: 1,
  },
  statsGrid: {
    width: '100%',
    gap: Spacing[3],
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  gridCard: {
    flex: 1,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    minHeight: 80,
  },
  gridCardVal: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  gridCardLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Heatmap styles
  heatmapSectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption + 1,
    color: Colors.textSecondary,
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  heatmapRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing[2],
    marginVertical: Spacing[2],
  },
  heatmapBlock: {
    flex: 1,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapBlockTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  heatmapBlockVal: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  heatmapBlockSub: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
    marginTop: 2,
  },

  // Trend Chart styles
  trendCard: {
    width: '100%',
    padding: Spacing[4],
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    marginVertical: Spacing[2],
  },
  trendTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing[3],
  },
  trendEmptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing[2],
  },

  // Adaptive Level Banner styles
  adaptiveBanner: {
    width: '100%',
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    marginVertical: Spacing[3],
  },
  adaptiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  adaptiveTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
  },
  adaptiveDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  adaptiveActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  adaptiveBtnGo: {
    paddingHorizontal: Spacing[4],
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adaptiveBtnGoText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
  },
  adaptiveBtnNo: {
    paddingHorizontal: Spacing[4],
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adaptiveBtnNoText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
  },
  adaptiveSuccessText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    marginTop: Spacing[2],
  },
});
