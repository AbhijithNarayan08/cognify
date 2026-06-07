// src/features/train/screens/PatternFoldResults.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Target, Award, Flame, ArrowRight, Brain, Clock, ChevronDown, ChevronUp } from 'lucide-react-native';
import { t } from '../../../constants/useStrings';

// Components
import SpatialEfficiencyBadge from '../components/SpatialEfficiencyBadge';
import AngleAccuracyStrip from '../components/AngleAccuracyStrip';
import FoilBreakdownCard from '../components/FoilBreakdownCard';
import SpeedBonusCounter from '../components/SpeedBonusCounter';
import InsightCard from '../components/InsightCard';
import AdaptiveBanner from '../components/AdaptiveBanner';

// Charts
import SpatialSparkline from '../components/SpatialSparkline';
import AngleRadarChart from '../components/AngleRadarChart';
import MirrorTrapTrendLine from '../components/MirrorTrapTrendLine';

import { Typography, Spacing, Radius, Shadow } from '../../../theme';

export default function PatternFoldResults({
  score,
  roundsCompleted,
  accuracy,
  longestStreak,
  gameSpecificMetrics = {},
  Colors,
  remainingExercises = [],
  handlePrimaryCTA,
  handleSecondaryCTA,
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'history'
  const [history, setHistory] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  useEffect(() => {
    // Load historical sessions & level suggestions
    Promise.all([
      AsyncStorage.getItem('cognify:patternfoldsessions'),
      AsyncStorage.getItem('cognify:userPrefs:patternfold'),
    ]).then(([sessionsStr, prefsStr]) => {
      if (sessionsStr) {
        try {
          const parsed = JSON.parse(sessionsStr);
          setHistory(parsed);
        } catch (e) {
          setHistory([]);
        }
      }
      if (prefsStr) {
        try {
          const parsed = JSON.parse(prefsStr);
          if (parsed.adaptiveSuggestion) {
            setSuggestion(parsed.adaptiveSuggestion);
          }
        } catch (e) {
          setSuggestion(null);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleAcceptSuggestion = () => {
    if (!suggestion) return;
    AsyncStorage.setItem('cognify:userPrefs:patternfold', JSON.stringify({
      lastLevel: suggestion.toLevel,
      adaptiveSuggestion: null,
    })).then(() => {
      setSuggestion(null);
      // Clean level update
      alert(t('patternFold.results.alertSuccess', { level: suggestion.toLevel }));
    });
  };

  const handleDismissSuggestion = () => {
    AsyncStorage.setItem('cognify:userPrefs:patternfold', JSON.stringify({
      lastLevel: gameSpecificMetrics.rounds ? (gameSpecificMetrics.rounds[0]?.level || 1) : 1,
      adaptiveSuggestion: null,
    })).then(() => {
      setSuggestion(null);
    });
  };

  const toggleExpandSession = (sid) => {
    setExpandedSessionId(expandedSessionId === sid ? null : sid);
  };

  // Find previous session score for delta representation
  const activeHistory = history.filter(h => !h.abandoned);
  const prevSession = activeHistory.length > 1 ? activeHistory[1] : null;
  const prevEfficiency = prevSession ? prevSession.spatialEfficiency : null;
  const isNewBest = activeHistory.length > 0 && 
    activeHistory.every(h => h.sessionId === activeHistory[0].sessionId || activeHistory[0].spatialEfficiency >= h.spatialEfficiency);

  // Active pattern detected in this session
  const activePattern = gameSpecificMetrics.patternIds && gameSpecificMetrics.patternIds.length > 0
    ? gameSpecificMetrics.patternIds[0]
    : null;

  return (
    <View style={styles.mainContainer}>
      {/* Dynamic Header */}
      <View style={styles.header}>
        <View style={[styles.domainChip, { backgroundColor: 'rgba(235, 68, 140, 0.15)' }]}>
          <Text style={[styles.domainChipText, { color: Colors.domain.spatial.main }]}>
            {t('patternFold.results.domainTitle')}
          </Text>
        </View>
        <Text style={styles.exerciseName}>{t('patternFold.results.exerciseName')}</Text>
      </View>

      {/* Glassmorphic Double-Tab Toggle */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
          onPress={() => setActiveTab('summary')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && { color: Colors.domain.spatial.main }]}>
            {t('patternFold.results.tabSummary')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'history' && { color: Colors.domain.spatial.main }]}>
            {t('patternFold.results.tabHistory')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'summary' ? (
          /* ────────── SUMMARY VIEW ────────── */
          <View style={styles.tabContent}>
            {/* Speed Bonus count-up badge */}
            <SpeedBonusCounter count={gameSpecificMetrics.eliteSpeedCount || 0} Colors={Colors} />

            {/* Spatial Efficiency Badge */}
            <SpatialEfficiencyBadge
              score={gameSpecificMetrics.spatialEfficiency ?? 0}
              prevScore={prevEfficiency}
              isNewBest={isNewBest}
              Colors={Colors}
            />

            {/* Standard Metrics Card */}
            <View style={[styles.metricsList, Shadow.sm, { backgroundColor: Colors.surface }]}>
              <View style={styles.metricRow}>
                <Target size={18} color={Colors.textSecondary} />
                <Text style={styles.metricLabel}>{t('train.results.roundsCompleted')}</Text>
                <Text style={styles.metricValue}>{roundsCompleted}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricRow}>
                <Award size={18} color={Colors.textSecondary} />
                <Text style={styles.metricLabel}>{t('train.results.accuracy')}</Text>
                <Text style={styles.metricValue}>{accuracy}%</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricRow}>
                <Flame size={18} color={Colors.textSecondary} />
                <Text style={styles.metricLabel}>{t('train.results.longestStreak')}</Text>
                <Text style={styles.metricValue}>{t('train.results.streakInRow', { streak: longestStreak })}</Text>
              </View>
            </View>

            {/* Dynamic Level Up/Down Prompts */}
            {suggestion && (
              <AdaptiveBanner
                suggestion={suggestion}
                onAccept={handleAcceptSuggestion}
                onDismiss={handleDismissSuggestion}
                Colors={Colors}
              />
            )}

            {/* Angle Accuracy Strip */}
            <AngleAccuracyStrip
              angleAccuracy={gameSpecificMetrics.angleAccuracy}
              Colors={Colors}
            />

            {/* Error Foil Breakdown */}
            <FoilBreakdownCard
              foilBreakdown={gameSpecificMetrics.foilBreakdown}
              Colors={Colors}
            />

            {/* Diagnostic Cognitive Findings */}
            {activePattern && (
              <InsightCard patternId={activePattern} Colors={Colors} />
            )}

            {/* Slider Switch See Progress CTA */}
            <TouchableOpacity
              style={[styles.progressCTA, Shadow.sm, { borderColor: Colors.domain.spatial.main }]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.8}
            >
              <Brain size={18} color={Colors.domain.spatial.main} />
              <Text style={[styles.progressCTAText, { color: Colors.domain.spatial.main }]}>
                {t('patternFold.results.analyzeHistory')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ────────── LONGITUDINAL HISTORY & TRENDS VIEW ────────── */
          <View style={styles.tabContent}>
            {/* Efficiency trend Bezier */}
            <SpatialSparkline history={history} Colors={Colors} />

            {/* Concentric Radar Accuracy */}
            <AngleRadarChart history={history} Colors={Colors} />

            {/* Mirror Trap Suppression */}
            <MirrorTrapTrendLine history={history} Colors={Colors} />

            {/* Historical Sessions List */}
            <View style={styles.historySection}>
              <Text style={[styles.historyTitle, { color: Colors.textSecondary }]}>{t('patternFold.results.sessionHistoryTitle')}</Text>

              {activeHistory.length === 0 ? (
                <Text style={[styles.emptyHistory, { color: Colors.textMuted }]}>
                  {t('patternFold.results.emptyHistory')}
                </Text>
              ) : (
                <View style={styles.historyList}>
                  {activeHistory.map((s, idx) => {
                    const isExpanded = expandedSessionId === s.sessionId;
                    const date = new Date(s.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    });
                    
                    return (
                      <View key={s.sessionId || idx} style={[styles.historyCard, Shadow.sm]}>
                        <TouchableOpacity
                          style={styles.historyCardHeader}
                          onPress={() => toggleExpandSession(s.sessionId)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.historyMeta}>
                            <Text style={styles.historyDate}>{date}</Text>
                            <Text style={[styles.historyLevel, { color: Colors.textMuted }]}>
                              {t('patternFold.results.levelPrefix', { level: s.level })}
                            </Text>
                          </View>
                          
                          <View style={styles.historyScores}>
                            <View style={styles.scorePill}>
                              <Text style={styles.scorePillText}>{t('patternFold.results.scorePts', { score: s.score })}</Text>
                            </View>
                            <View style={[styles.efficiencyPill, { backgroundColor: 'rgba(235, 68, 140, 0.08)' }]}>
                              <Text style={[styles.efficiencyPillText, { color: Colors.domain.spatial.main }]}>
                                {t('patternFold.results.efficiencyPill', { efficiency: s.spatialEfficiency })}
                              </Text>
                            </View>
                            {isExpanded ? (
                              <ChevronUp size={16} color="#666" style={{ marginLeft: Spacing[1] }} />
                            ) : (
                              <ChevronDown size={16} color="#666" style={{ marginLeft: Spacing[1] }} />
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Expanded diagnostics sub-panel */}
                        {isExpanded && (
                          <View style={styles.expandedPanel}>
                            <View style={styles.panelDivider} />
                            
                            <View style={styles.panelRow}>
                              <Text style={styles.panelLabel}>{t('patternFold.results.avgSpeed')}</Text>
                              <Text style={styles.panelVal}>{t('patternFold.results.avgSpeedVal', { speed: s.avgReactionTimeMs })}</Text>
                            </View>
                            <View style={styles.panelRow}>
                              <Text style={styles.panelLabel}>{t('patternFold.results.eliteSpeeds')}</Text>
                              <Text style={styles.panelVal}>{t('patternFold.results.eliteSpeedsVal', { rounds: s.eliteSpeedCount || 0 })}</Text>
                            </View>

                            <View style={styles.panelDivider} />
                            
                            {/* Inner mini foil rates */}
                            <Text style={styles.panelSection}>{t('patternFold.results.errorAttribution')}</Text>
                            <View style={styles.panelGrid}>
                              <View style={styles.panelGridCard}>
                                <Text style={[styles.panelGridVal, { color: Colors.domain.spatial.main }]}>
                                  {Math.round((s.foilBreakdown?.mirror || 0) * 100)}%
                                </Text>
                                <Text style={styles.panelGridLabel}>{t('patternFold.results.errorMirror')}</Text>
                              </View>
                              <View style={styles.panelGridCard}>
                                <Text style={[styles.panelGridVal, { color: '#0073E6' }]}>
                                  {Math.round((s.foilBreakdown?.angle || 0) * 100)}%
                                </Text>
                                <Text style={styles.panelGridLabel}>{t('patternFold.results.errorAngle')}</Text>
                              </View>
                              <View style={styles.panelGridCard}>
                                <Text style={[styles.panelGridVal, { color: '#F4A041' }]}>
                                  {Math.round((s.foilBreakdown?.chirality || 0) * 100)}%
                                </Text>
                                <Text style={styles.panelGridLabel}>{t('patternFold.results.errorChiral')}</Text>
                              </View>
                            </View>

                            {s.patternIds && s.patternIds.length > 0 && (
                              <>
                                <View style={styles.panelDivider} />
                                <View style={styles.patternBox}>
                                  <Brain size={14} color={Colors.domain.spatial.main} />
                                  <Text style={styles.patternBoxText}>
                                    {t('patternFold.results.patternDetected', { pattern: s.patternIds[0].replace(/_/g, ' ') })}
                                  </Text>
                                </View>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA Buttons persistent at bottom */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: Colors.brandPrimary || Colors.domain.spatial.main }]}
          onPress={handlePrimaryCTA}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {remainingExercises && remainingExercises.length > 0 ? t('train.results.nextExercise') : t('train.results.done')}
          </Text>
          {remainingExercises && remainingExercises.length > 0 && (
            <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: Spacing[2] }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSecondaryCTA}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>
            {t('train.results.playAgain')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAFAFA',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing[4],
    marginBottom: Spacing[3],
  },
  domainChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    marginBottom: Spacing[2],
  },
  domainChipText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 1.0,
  },
  exerciseName: {
    fontSize: Typography.size.h3,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A1A1A',
  },
  tabBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: Radius.full,
    padding: 3,
    width: '90%',
    marginVertical: Spacing[2],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    ...Shadow.sm,
  },
  tabText: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
    color: '#666666',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[8],
  },
  tabContent: {
    width: '100%',
  },
  metricsList: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    width: '100%',
    marginVertical: Spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    flex: 1,
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.medium,
    color: '#333333',
    marginLeft: Spacing[3],
  },
  metricValue: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
    color: '#111111',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#EAEAEA',
    marginVertical: Spacing[3],
  },
  progressCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    padding: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    width: '100%',
    marginVertical: Spacing[4],
    backgroundColor: 'rgba(235, 68, 140, 0.02)',
  },
  progressCTAText: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
  },
  historySection: {
    width: '100%',
    marginTop: Spacing[4],
  },
  historyTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  emptyHistory: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
    paddingVertical: Spacing[4],
  },
  historyList: {
    gap: Spacing[2],
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[3],
  },
  historyMeta: {
    gap: 2,
  },
  historyDate: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
    color: '#333',
  },
  historyLevel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
  },
  historyScores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  scorePill: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  scorePillText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#555',
  },
  efficiencyPill: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  efficiencyPillText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
  },
  expandedPanel: {
    backgroundColor: '#FAFAFA',
    padding: Spacing[3],
    paddingTop: 0,
  },
  panelDivider: {
    height: 0.5,
    backgroundColor: '#EAEAEA',
    marginVertical: Spacing[2],
  },
  panelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  panelLabel: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.medium,
    color: '#666',
  },
  panelVal: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
    color: '#333',
  },
  panelSection: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#888',
    marginVertical: Spacing[1],
  },
  panelGrid: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  panelGridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm,
    padding: Spacing[2],
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#EAEAEA',
  },
  panelGridVal: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
  },
  panelGridLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#888',
    marginTop: 2,
  },
  patternBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#FFF0F5',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
  },
  patternBoxText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#C71585',
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing[4],
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    gap: Spacing[3],
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
  },
  secondaryButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
  },
});
