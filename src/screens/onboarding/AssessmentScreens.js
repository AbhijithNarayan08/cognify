// ─────────────────────────────────────────────────────────────
// Assessment Intro Screen
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ChevronUp, ChevronDown, Circle, Square, Star, Triangle, Diamond, ArrowRight, Hexagon } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { useApp } from '../../context/AppContext';
import { t } from '../../constants/useStrings';

// High-fidelity training games imports
import SignalChain from '../../features/train/games/SignalChain';
import FlashSort from '../../features/train/games/FlashSort';
import LighthouseWatch from '../../features/train/games/LighthouseWatch';
import ContextSwitch from '../../features/train/games/ContextSwitch';
import WordWeave from '../../features/train/games/WordWeave';
import PatternFold from '../../features/train/games/PatternFold';

const GAME_COMPONENTS = {
  'memory': SignalChain,
  'speed': FlashSort,
  'attention': LighthouseWatch,
  'executive': ContextSwitch,
  'verbal': WordWeave,
  'spatial': PatternFold,
};

const { width, height } = Dimensions.get('window');

export function AssessmentIntroScreen({ navigation }) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const Colors = useThemeColors();
  const introStyles = useMemo(() => getIntroStyles(Colors), [Colors]);
  const DOMAINS = getDomains(Colors);

  const toggleExpand = () => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <View style={introStyles.container}>
      {/* Floating domain orbs */}
      <View style={introStyles.orbRow}>
        {DOMAINS.map((d, i) => (
          <View
            key={d.id}
            style={[
              introStyles.orb,
              { backgroundColor: d.color.main, marginTop: i % 2 === 0 ? 0 : 20 },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={introStyles.content} showsVerticalScrollIndicator={false}>
        <Text style={introStyles.headline}>{t('onboarding.assessmentIntro.headline')}</Text>
        <Text style={introStyles.body}>
          {t('onboarding.assessmentIntro.body')}
        </Text>
        <Text style={[introStyles.body, { fontSize: Typography.size.caption, color: Colors.textMuted, fontStyle: 'italic', marginTop: Spacing[2], paddingHorizontal: Spacing[4], textAlign: 'center' }]}>
          {t('onboarding.assessmentIntro.footnote')}
        </Text>

        {/* Expandable FAQ */}
        <TouchableOpacity style={introStyles.faqTrigger} onPress={toggleExpand}>
          <Text style={introStyles.faqTriggerText}>
            {t('onboarding.assessmentIntro.faqTrigger')}
          </Text>
          {expanded ? <ChevronUp size={16} color={Colors.brandPrimary} /> : <ChevronDown size={16} color={Colors.brandPrimary} />}
        </TouchableOpacity>

        <Animated.View style={[introStyles.faqContent, { height: expandHeight, overflow: 'hidden' }]}>
          {DOMAINS.map((d) => (
            <View key={d.id} style={introStyles.domainRow}>
              <View style={[introStyles.domainDot, { backgroundColor: d.color.main }]} />
              <View>
                <Text style={introStyles.domainName}>{d.label}</Text>
                <Text style={introStyles.domainDesc}>{d.fullLabel}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <TouchableOpacity
          style={introStyles.cta}
          onPress={() => navigation.navigate('Assessment')}
          activeOpacity={0.85}
        >
          <Text style={introStyles.ctaText}>{t('onboarding.assessmentIntro.cta')}</Text>
        </TouchableOpacity>
        <Text style={introStyles.timeNote}>{t('onboarding.assessmentIntro.timeNote')}</Text>
      </ScrollView>
    </View>
  );
}

const getIntroStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg, paddingTop: 60 },
  orbRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: Spacing[8],
    paddingHorizontal: Spacing[6],
  },
  orb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.85,
  },
  content: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[10],
  },
  headline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    lineHeight: 36,
    marginBottom: Spacing[4],
  },
  body: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    lineHeight: 26,
    marginBottom: Spacing[5],
  },
  faqTrigger: { 
    marginBottom: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  faqTriggerText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.label,
    color: Colors.brandPrimary,
  },
  faqContent: { marginBottom: Spacing[5] },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  domainDot: { width: 10, height: 10, borderRadius: 5 },
  domainName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.label,
    color: Colors.textPrimary,
  },
  domainDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
  },
  cta: {
    backgroundColor: Colors.coral,
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: Spacing[6],
  },
  ctaText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
  timeNote: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing[3],
  },
});

// ─────────────────────────────────────────────────────────────
// Assessment Screen — runs all 6 domains
// Overhauled into high-fidelity representations of internal games
// ─────────────────────────────────────────────────────────────

const ASSESSMENT_TASKS = [
  { domain: 'memory',    instructionKey: 'onboarding.assessment.task.memory',    type: 'sequence' },
  { domain: 'speed',     instructionKey: 'onboarding.assessment.task.speed',     type: 'sort' },
  { domain: 'attention', instructionKey: 'onboarding.assessment.task.attention',  type: 'vigilance' },
  { domain: 'executive', instructionKey: 'onboarding.assessment.task.executive',  type: 'match' },
  { domain: 'verbal',    instructionKey: 'onboarding.assessment.task.verbal',     type: 'analogy' },
  { domain: 'spatial',   instructionKey: 'onboarding.assessment.task.spatial',    type: 'rotation' },
];

const SORT_STIMULI = ['circle', 'square', 'circle', 'square', 'square', 'circle', 'square', 'circle'];

const ATTENTION_STIMULI = ['triangle', 'star', 'circle', 'hexagon', 'star', 'circle', 'triangle', 'star', 'hexagon', 'circle'];

const SWITCH_STIMULI = [
  { shape: 'circle', color: '#E24B4A', rule: 'shape' }, // red circle - shape (Circle)
  { shape: 'square', color: '#185FA5', rule: 'shape' }, // blue square - shape (Square)
  { shape: 'circle', color: '#185FA5', rule: 'color' }, // blue circle - color (Blue)
  { shape: 'square', color: '#E24B4A', rule: 'color' }, // red square - color (Red)
  { shape: 'circle', color: '#E24B4A', rule: 'color' }, // red circle - color (Red)
  { shape: 'square', color: '#185FA5', rule: 'shape' }, // blue square - shape (Square)
];

const VERBAL_Q = [
  {
    stem: 'feather : light :: rock : [___]',
    options: ['heavy', 'hard', 'grey', 'stone'],
    answer: 0,
  },
  {
    stem: 'cold : ice :: hot : [___]',
    options: ['steam', 'fire', 'sun', 'warm'],
    answer: 1,
  },
  {
    stem: 'memory : past :: vision : [___]',
    options: ['future', 'eye', 'dream', 'sight'],
    answer: 0,
  },
];

const SPATIAL_Q = [
  {
    target: [1, 0, 0, 1, 1, 0, 0, 0, 1], // L-shape
    options: [
      [0, 1, 1, 0, 1, 0, 1, 0, 0], // Rotated 90 deg clockwise (Correct)
      [1, 1, 0, 0, 1, 0, 0, 1, 1], // Wrong
      [0, 0, 1, 0, 1, 1, 1, 0, 0], // Mirror
    ],
    answer: 0,
  },
  {
    target: [0, 1, 0, 1, 1, 1, 0, 1, 0], // Plus-shape
    options: [
      [1, 0, 1, 0, 1, 0, 1, 0, 1], // Wrong
      [0, 1, 0, 1, 1, 1, 0, 1, 0], // Rotated (Correct)
      [0, 1, 0, 1, 0, 1, 0, 1, 0], // Mirror
    ],
    answer: 1,
  },
  {
    target: [1, 1, 0, 0, 1, 1, 0, 0, 0], // Z-shape
    options: [
      [1, 0, 0, 1, 1, 0, 0, 1, 1], // Wrong
      [0, 1, 1, 1, 1, 0, 0, 0, 0], // Mirror
      [0, 0, 1, 0, 1, 1, 0, 1, 0], // Rotated (Correct)
    ],
    answer: 2,
  },
];

function OnboardingBlockGrid({ pattern, size = 60, Colors }) {
  return (
    <View style={{ width: size, height: size, flexWrap: 'wrap', flexDirection: 'row', overflow: 'hidden', borderRadius: Radius.sm }}>
      {pattern.map((val, idx) => (
        <View
          key={idx}
          style={{
            width: size / 3,
            height: size / 3,
            backgroundColor: val ? Colors.domain.spatial.main : Colors.surfaceAlt,
            borderWidth: 0.5,
            borderColor: Colors.surface,
          }}
        />
      ))}
    </View>
  );
}

export function AssessmentScreen({ navigation }) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [trialIndex, setTrialIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const attentionHitsRef = useRef(0);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const pendingActionRef = useRef(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isFinishing) return;
      e.preventDefault();
      pendingActionRef.current = e.data.action;
      setShowExitConfirm(true);
    });
    return unsubscribe;
  }, [navigation, isFinishing]);

  const Colors = useThemeColors();
  const aStyles = useMemo(() => getAStyles(Colors), [Colors]);
  const DOMAINS = getDomains(Colors);

  const task = ASSESSMENT_TASKS[taskIndex];
  const domain = DOMAINS.find(d => d.id === task.domain);

  // Task Transitions
  useEffect(() => {
    setTrialIndex(0);
    attentionHitsRef.current = 0;

    Animated.timing(progressAnim, {
      toValue: taskIndex / ASSESSMENT_TASKS.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [taskIndex]);

  const recordScore = (correct, total, reactionMs = 800) => {
    const domainId = task.domain;
    const accuracy = correct / total;
    const speedBonus = Math.max(0, 1 - reactionMs / 2000);
    const raw = Math.round(480 + accuracy * 380 + speedBonus * 80 + Math.random() * 40);
    setScores(prev => ({ ...prev, [domainId]: Math.min(980, raw) }));
  };

  const nextTask = () => {
    if (taskIndex < ASSESSMENT_TASKS.length - 1) {
      setTaskIndex(taskIndex + 1);
    } else {
      setIsFinishing(true);
      setTimeout(() => {
        navigation.navigate('Processing', { scores });
      }, 50);
    }
  };

  const handleGameRoundComplete = (result) => {
    const domainId = task.domain;
    
    if (domainId === 'memory') {
      // Memory (Signal Chain) ends after 1 full sequence round
      const isCorrect = result.isCorrect;
      recordScore(isCorrect ? 4 : 3, 4, 380);
      setTimeout(nextTask, 1200); // Wait for the feedback pulse animation to complete!
    } else if (domainId === 'speed') {
      // Speed (Flash Sort) runs for 8 trials
      const isCorrect = result.isCorrect;
      const next = trialIndex + 1;
      setTrialIndex(next);
      if (next >= 8) {
        recordScore(isCorrect ? 7 : 5, 8, 450);
        setTimeout(nextTask, 1000);
      }
    } else if (domainId === 'attention') {
      // Attention (Lighthouse Watch) runs for 10 trials
      if (result.metrics?.isHit) {
        attentionHitsRef.current++;
      }
      const next = trialIndex + 1;
      setTrialIndex(next);
      if (next >= 10) {
        recordScore(attentionHitsRef.current, 10, 420);
        setTimeout(nextTask, 1000);
      }
    } else if (domainId === 'executive') {
      // Executive (Context Switch) runs for 6 trials
      const isCorrect = result.isCorrect;
      const next = trialIndex + 1;
      setTrialIndex(next);
      if (next >= 6) {
        recordScore(isCorrect ? 5 : 4, 6);
        setTimeout(nextTask, 1000);
      }
    } else if (domainId === 'verbal') {
      // Verbal (Word Weave) runs for 3 questions
      const isCorrect = result.isCorrect;
      const next = trialIndex + 1;
      setTrialIndex(next);
      if (next >= 3) {
        recordScore(isCorrect ? 3 : 2, 3);
        setTimeout(nextTask, 1000);
      }
    } else if (domainId === 'spatial') {
      // Spatial (Pattern Fold) runs for 3 questions
      const isCorrect = result.isCorrect;
      const next = trialIndex + 1;
      setTrialIndex(next);
      if (next >= 3) {
        recordScore(isCorrect ? 3 : 2, 3);
        setTimeout(nextTask, 1000);
      }
    }
  };

  // ── Render task content ──
  const renderTask = () => {
    const GameComponent = GAME_COMPONENTS[task.domain];
    
    if (GameComponent) {
      return (
        <GameComponent
          level={1}
          isActive={!showExitConfirm}
          Colors={Colors}
          multiplier={1.0}
          streakCount={trialIndex}
          onRoundComplete={handleGameRoundComplete}
          onTimerStateChange={() => {}}
        />
      );
    }
    
    return null;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={aStyles.container}>
      {/* Top bar */}
      <View style={aStyles.topBar}>
        <View style={[aStyles.domainChip, { backgroundColor: domain.color.light }]}>
          <Text style={[aStyles.domainChipText, { color: domain.color.main }]}>{domain.label}</Text>
        </View>
        <Text style={aStyles.taskCount}>{t('onboarding.assessment.taskProgress', { current: taskIndex + 1, total: ASSESSMENT_TASKS.length })}</Text>
      </View>

      {/* Progress bar */}
      <View style={aStyles.progressTrack}>
        <Animated.View style={[aStyles.progressFill, { width: progressWidth, backgroundColor: domain.color.main }]} />
      </View>

      {/* Instruction */}
      <Text style={aStyles.instruction}>{t(task.instructionKey)}</Text>

      {/* Task content */}
      <View style={aStyles.taskArea}>
        {renderTask()}
      </View>

      <ConfirmModal
        visible={showExitConfirm}
        title={t('onboarding.assessment.exitConfirm.title')}
        body={t('onboarding.assessment.exitConfirm.body')}
        confirmText={t('onboarding.assessment.exitConfirm.yes')}
        cancelText={t('onboarding.assessment.exitConfirm.no')}
        onConfirm={() => {
          setShowExitConfirm(false);
          if (pendingActionRef.current) {
            navigation.dispatch(pendingActionRef.current);
          }
        }}
        onCancel={() => {
          setShowExitConfirm(false);
          pendingActionRef.current = null;
        }}
        Colors={Colors}
      />
    </View>
  );
}

const getAStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing[6], paddingTop: 56, paddingBottom: Spacing[3],
  },
  domainChip: {
    borderRadius: Radius.sm, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1],
  },
  domainChipText: {
    fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.caption,
  },
  taskCount: {
    fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption, color: Colors.textMuted,
  },
  progressTrack: { height: 3, backgroundColor: Colors.border, marginHorizontal: Spacing[6] },
  progressFill: { height: 3 },
  instruction: {
    fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.body,
    color: Colors.textSecondary, textAlign: 'center',
    paddingHorizontal: Spacing[8], marginTop: Spacing[6], lineHeight: 24,
  },
  taskArea: { flex: 1, justifyContent: 'center' },

  // Memory (Signal Chain nodes 3x3)
  seqContainer: { alignItems: 'center', gap: Spacing[5] },
  seqLabel: {
    fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.label,
    color: Colors.textSecondary,
  },
  grid3x3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: 220,
    marginVertical: Spacing[4],
  },
  gridNode: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Speed (Flash Sort split layouts)
  splitLayout: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  splitPanel: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  cornerHintLeft: {
    position: 'absolute',
    bottom: Spacing[12],
    left: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cornerHintRight: {
    position: 'absolute',
    bottom: Spacing[12],
    right: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cornerLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
  },
  centeredStimulusLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stimulusCard: {
    width: 140,
    height: 140,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    ...Shadow.md,
  },
  trialMiniCount: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    marginTop: Spacing[4],
    textAlign: 'center',
  },

  // Attention (Lighthouse Watch vigilance flow)
  fullScreenTap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  floatDeltaContainer: {
    position: 'absolute',
    top: 32,
    right: 32,
    zIndex: 10,
  },
  floatDeltaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body + 2,
  },
  feedbackCaption: {
    fontSize: Typography.size.caption,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
    marginTop: Spacing[4],
  },

  // Executive (Context Switch rules)
  switchContainer: {
    alignItems: 'center',
    gap: Spacing[6],
    width: '100%',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing[4],
    width: '100%',
    marginTop: Spacing[2],
  },
  sortBtn: {
    flex: 1,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  sortBtnText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.label,
    color: Colors.textInverse,
  },

  // Verbal (Word Weave premium card)
  verbalContainer: {
    gap: Spacing[5],
    width: '100%',
  },
  analogyCard: {
    padding: Spacing[5],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    width: '100%',
  },
  verbalStem: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textPrimary,
    lineHeight: 26,
    textAlign: 'center',
  },
  verbalOptions: {
    gap: Spacing[3],
    width: '100%',
  },
  verbalOption: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verbalOptionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textPrimary,
  },

  // Spatial (Pattern Fold block grid)
  spatialContainer: {
    alignItems: 'center',
    gap: Spacing[4],
    width: '100%',
  },
  blockGridContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing[2],
  },
  spatialTargetCard: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  spatialTargetLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
  },
  spatialOptionsTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    marginTop: Spacing[2],
  },
  spatialOptions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  spatialOptionBtn: {
    padding: Spacing[2],
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export function ProcessingScreen({ route, navigation }) {
  const { dispatch } = useApp();
  const scores = route?.params?.scores || {};
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const Colors = useThemeColors();
  const DOMAINS = getDomains(Colors);
  const procStyles = useMemo(() => getProcStyles(Colors), [Colors]);

  // Fill any missing domains with reasonable random scores
  const filledScores = {};
  DOMAINS.forEach(d => {
    filledScores[d.id] = scores[d.id] || Math.floor(500 + Math.random() * 200);
  });

  const cognitiveScore = Math.round(
    Object.values(filledScores).reduce((a, b) => a + b, 0) / DOMAINS.length
  );

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    const payload = {
      cognitiveScore,
      domainScores: filledScores,
      brainAge: Math.max(20, Math.round(cognitiveScore / 24) + (Math.random() > 0.5 ? -2 : 2)),
      cohortPercentile: Math.round((cognitiveScore - 400) / 6),
    };

    setTimeout(() => {
      dispatch({ type: 'COMPLETE_ASSESSMENT', payload });
      navigation.navigate('Results');
    }, 2200);
  }, []);

  return (
    <View style={procStyles.container}>
      <LinearGradient colors={['#0D4F7C', '#1B6CA8']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[procStyles.orb, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        {DOMAINS.map((d, i) => (
          <View
            key={d.id}
            style={[procStyles.particle, {
              backgroundColor: d.color.main,
              transform: [
                { rotate: `${i * 60}deg` },
                { translateY: -70 },
              ],
            }]}
          />
        ))}
        <View style={procStyles.orbCore} />
      </Animated.View>
      <Text style={procStyles.copy}>{t('onboarding.assessment.brainMap')}</Text>
    </View>
  );
}

const getProcStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orb: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  orbCore: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  particle: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6, opacity: 0.9,
  },
  copy: {
    fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.body,
    color: 'rgba(255,255,255,0.8)', marginTop: Spacing[8],
  },
});


// ─────────────────────────────────────────────────────────────
// Results Screen
// ─────────────────────────────────────────────────────────────
export function ResultsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { cognitiveScore, domainScores, brainAge, cohortPercentile } = state;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const Colors = useThemeColors();
  const resStyles = useMemo(() => getResStyles(Colors), [Colors]);
  const DOMAINS = getDomains(Colors);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const strongestDomain = useMemo(() => {
    if (!domainScores) return null;
    let best = null;
    let max = -1;
    DOMAINS.forEach(d => {
      const s = domainScores[d.id] || 0;
      if (s > max) {
        max = s;
        best = d;
      }
    });
    return best;
  }, [domainScores, DOMAINS]);

  const handleContinue = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  };

  return (
    <ScrollView style={resStyles.container} contentContainerStyle={resStyles.content} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={resStyles.headline}>{t('onboarding.assessment.results.headline')}</Text>

        {/* Score section */}
        <View style={[resStyles.scoreCard, Shadow.md]}>
          <Text style={resStyles.scoreNum}>{cognitiveScore}</Text>
          <Text style={resStyles.scoreLabel}>{t('onboarding.assessment.results.scoreLabel')}</Text>
          <Text style={resStyles.percentile}>
            {t('onboarding.assessment.results.percentile', { percentile: cohortPercentile })}
          </Text>
        </View>

        {/* Brain age */}
        <View style={[resStyles.infoCard, { backgroundColor: Colors.brandLight }, Shadow.sm]}>
          <Text style={resStyles.infoLabel}>{t('onboarding.assessment.results.brainAgeLabel')}</Text>
          <Text style={resStyles.brainAge}>{brainAge}</Text>
          <Text style={resStyles.infoNote}>{t('onboarding.assessment.results.brainAgeEstimate')}</Text>
        </View>

        {/* Strongest domain */}
        {strongestDomain && (
          <View style={[resStyles.infoCard, { backgroundColor: strongestDomain.color.light }, Shadow.sm]}>
            <Text style={[resStyles.infoLabel, { color: strongestDomain.color.main }]}>{t('onboarding.assessment.results.strengthLabel')}</Text>
            <Text style={[resStyles.strengthLabel, { color: strongestDomain.color.main }]}>
              {strongestDomain.label}
            </Text>
            <Text style={resStyles.infoNote}>
              {t('onboarding.assessment.results.strengthBody', { domain: strongestDomain.label })}
            </Text>
          </View>
        )}

        {/* Domain scores */}
        <Text style={resStyles.domainsTitle}>{t('onboarding.assessment.results.domainsTitle')}</Text>
        {domainScores && DOMAINS.map(d => (
          <View key={d.id} style={resStyles.domainRow}>
            <View style={[resStyles.domainDot, { backgroundColor: d.color.main }]} />
            <Text style={resStyles.domainName}>{d.label}</Text>
            <View style={resStyles.domainBar}>
              <View style={[
                resStyles.domainBarFill,
                { width: `${((domainScores[d.id] - 400) / 600) * 100}%`, backgroundColor: d.color.main }
              ]} />
            </View>
            <Text style={[resStyles.domainScore, { color: d.color.main }]}>{domainScores[d.id]}</Text>
          </View>
        ))}

        <TouchableOpacity style={resStyles.cta} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={resStyles.ctaText}>{t('onboarding.assessment.results.cta')}</Text>
          <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const getResStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  content: { paddingHorizontal: Spacing[6], paddingTop: 64, paddingBottom: Spacing[10] },
  headline: {
    fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.h1,
    color: Colors.textPrimary, marginBottom: Spacing[6],
  },
  scoreCard: {
    backgroundColor: Colors.brandPrimary, borderRadius: Radius.xl,
    padding: Spacing[8], alignItems: 'center', marginBottom: Spacing[4],
  },
  scoreNum: {
    fontFamily: Typography.fontFamily.bold, fontSize: 64,
    color: Colors.textInverse, lineHeight: 72,
  },
  scoreLabel: {
    fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.label,
    color: 'rgba(255,255,255,0.7)', marginBottom: Spacing[2],
  },
  percentile: {
    fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.body,
    color: 'rgba(255,255,255,0.9)', textAlign: 'center',
  },
  infoCard: {
    borderRadius: Radius.lg, padding: Spacing[5], marginBottom: Spacing[3],
  },
  infoLabel: {
    fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.caption,
    color: Colors.brandPrimary, marginBottom: Spacing[1],
  },
  brainAge: {
    fontFamily: Typography.fontFamily.bold, fontSize: 48, color: Colors.brandPrimary, lineHeight: 56,
  },
  strengthLabel: {
    fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.h1,
  },
  infoNote: {
    fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption,
    color: Colors.textMuted, marginTop: Spacing[2], lineHeight: 17,
  },
  domainsTitle: {
    fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.label,
    color: Colors.textSecondary,
    marginTop: Spacing[4], marginBottom: Spacing[3],
  },
  domainRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[3],
  },
  domainDot: { width: 8, height: 8, borderRadius: 4 },
  domainName: {
    fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.caption,
    color: Colors.textSecondary, width: 64,
  },
  domainBar: {
    flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden',
  },
  domainBarFill: { height: 6, borderRadius: 3 },
  domainScore: {
    fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.caption, width: 36, textAlign: 'right',
  },
  cta: {
    backgroundColor: Colors.coral, borderRadius: Radius.full,
    paddingVertical: 18, alignItems: 'center', justifyContent: 'center', marginTop: Spacing[8],
    flexDirection: 'row',
  },
  ctaText: {
    fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
});
