// src/features/train/screens/SessionResultScreen.js
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Target, Flame, Zap, ArrowRight, CornerDownLeft } from 'lucide-react-native';

import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../../theme';
import { t } from '../../../constants/useStrings';

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
  let scoreDeltaText = 'first session';
  
  if (prevScore !== null && prevScore !== undefined) {
    const delta = score - prevScore;
    if (delta > 0) {
      scoreColor = Colors.positive;
      scoreDeltaText = `+${delta} from last session`;
    } else if (delta < 0) {
      scoreColor = Colors.coral;
      scoreDeltaText = `${delta} from last session`;
    } else {
      scoreColor = Colors.textMuted;
      scoreDeltaText = 'equal to last session';
    }
  } else {
    scoreDeltaText = t('train.activeSession.firstSession') || 'your first session';
  }

  const handlePrimaryCTA = () => {
    if (remainingExercises && remainingExercises.length > 0) {
      // Continue daily workout
      navigation.navigate('ActiveSession', {
        singleExercise: remainingExercises[0],
        remainingExercises: remainingExercises.slice(1),
      });
    } else {
      // Return to main Train screen
      navigation.navigate('TrainRoot');
    }
  };

  const handleSecondaryCTA = () => {
    // Play again restarts the same game
    navigation.navigate('ActiveSession', {
      singleExercise: exercise,
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
    if (meanRt <= 250) return "excellent — elite response speed";
    if (meanRt <= 350) return "great — well above average";
    if (meanRt <= 450) return "good — above average";
    if (meanRt <= 600) return "average response speed";
    return "keep training — speed improves quickly";
  };

  if (exercise?.id === 'flash-sort') {
    const currentMean = gameSpecificMetrics.meanReactionTime || 0;
    
    let rtDeltaText = 'your first flash sort session';
    let rtDeltaColor = Colors.textMuted;
    if (prevMeanRT !== null && prevMeanRT !== undefined) {
      const rtDelta = currentMean - prevMeanRT;
      if (rtDelta < 0) {
        rtDeltaColor = Colors.positive;
        rtDeltaText = `−${Math.abs(rtDelta)}ms from last session`;
      } else if (rtDelta > 0) {
        rtDeltaColor = Colors.coral;
        rtDeltaText = `+${Math.abs(rtDelta)}ms from last session`;
      } else {
        rtDeltaColor = Colors.textMuted;
        rtDeltaText = `equal to last session`;
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
            <Text style={styles.earlyExitNote}>session ended early.</Text>
          )}
        </View>

        {/* Horizontal Large Stats Row */}
        <View style={styles.largeStatsRow}>
          {/* Stat 1: Mean Reaction Time */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: domain?.color.main }]}>
            <Text style={[styles.largeStatVal, { color: domain?.color.main }]}>
              {currentMean}ms
            </Text>
            <Text style={styles.largeStatLabel}>avg reaction time</Text>
            <Text style={[styles.largeStatDelta, { color: rtDeltaColor }]}>{rtDeltaText}</Text>
          </View>

          {/* Stat 2: Best Reaction Time */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: Colors.brandPrimary || '#F4A041' }]}>
            <Text style={[styles.largeStatVal, { color: Colors.brandPrimary || '#F4A041' }]}>
              {gameSpecificMetrics.fastestRT || 0}ms
            </Text>
            <Text style={styles.largeStatLabel}>fastest response</Text>
            {isNewPersonalBestRT && (
              <View style={[styles.pbBadge, { backgroundColor: Colors.brandPrimary || '#F4A041' }]}>
                <Text style={styles.pbBadgeText}>personal best</Text>
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
              new personal best reaction time — {gameSpecificMetrics.fastestRT || 0}ms!
            </Text>
          </Animated.View>
        )}

        {/* Contextual Benchmark Callout */}
        <View style={[styles.pbCalloutCard, Shadow.sm, { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1 }]}>
          <Text style={[styles.pbCalloutText, { color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
            your {currentMean}ms average is <Text style={{ color: domain?.color.main, fontFamily: Typography.fontFamily.bold }}>{benchmarkLabel}</Text>
          </Text>
        </View>

        {/* 2x2 Grid of Stats 3–6 */}
        <View style={styles.statsGrid}>
          <View style={styles.gridRow}>
            {/* Stat 3: Accuracy */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{accuracy}%</Text>
              <Text style={styles.gridCardLabel}>accuracy</Text>
            </View>

            {/* Stat 4: Rounds completed */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{roundsCompleted} rounds</Text>
              <Text style={styles.gridCardLabel}>rounds played</Text>
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

        {/* Raw Score Indicator Card */}
        <View style={[styles.pbCalloutCard, Shadow.sm, { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, justifyContent: 'center' }]}>
          <Text style={{ fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary }}>
            session score: <Text style={{ color: domain?.color.main, fontFamily: Typography.fontFamily.bold }}>{score.toLocaleString()} pts</Text>
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

          {/* Stat 2: Best streak */}
          <View style={[styles.largeStatCard, Shadow.md, { borderLeftWidth: 4, borderLeftColor: Colors.brandPrimary || '#F4A041' }]}>
            <Text style={[styles.largeStatVal, { color: Colors.brandPrimary || '#F4A041' }]}>
              {longestStreak}
            </Text>
            <Text style={styles.largeStatLabel}>best streak</Text>
          </View>
        </View>

        {/* Contextual Benchmark Callout */}
        <View style={[styles.pbCalloutCard, Shadow.sm, { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1 }]}>
          <Text style={[styles.pbCalloutText, { color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium }]}>
            your performance: <Text style={{ color: domain?.color.main, fontFamily: Typography.fontFamily.bold }}>{benchmarkLabel}</Text>
          </Text>
          <Text style={{ fontSize: Typography.size.caption, color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>
            {benchmarkDesc}
          </Text>
        </View>

        {/* 3-Axis Vigilance Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.gridRow}>
            {/* Hit Rate */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{hitRate}%</Text>
              <Text style={styles.gridCardLabel}>hit rate</Text>
            </View>

            {/* False Alarm Rate */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{FArate}%</Text>
              <Text style={styles.gridCardLabel}>false alarm rate</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Misses */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{misses}</Text>
              <Text style={styles.gridCardLabel}>total misses</Text>
            </View>

            {/* Total Rounds */}
            <View style={[styles.gridCard, Shadow.sm]}>
              <Text style={styles.gridCardVal}>{roundsCompleted}</Text>
              <Text style={styles.gridCardLabel}>total stimuli</Text>
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
  domainChipText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.caption, textTransform: 'lowercase' },
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
  scoreDelta: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.body, textTransform: 'lowercase' },

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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
  },
  earlyExitNote: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.coral || '#FF3B30',
    marginTop: Spacing[1],
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
    marginTop: 2,
  },
  largeStatDelta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
  },
  gridCardLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
    marginTop: 2,
  },
});
