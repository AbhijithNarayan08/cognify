// src/features/train/games/ContextSwitch.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Rect } from 'react-native-svg';
import { CONTEXT_SWITCH } from '../../../constants/gameConfig';
import { Typography, Spacing, Radius, Shadow } from '../../../theme';

const { width } = Dimensions.get('window');

const COLOR_MAP = {
  red: '#E24B4A',
  blue: '#185FA5',
};

export default function ContextSwitch({ level, isActive, onRoundComplete, Colors }) {
  const config = CONTEXT_SWITCH.levels[level] || CONTEXT_SWITCH.levels[1];

  // Game state
  const [currentRule, setCurrentRule] = useState('shape');
  const [prevRule, setPrevRule] = useState(null);
  const [stimulus, setStimulus] = useState(null);
  const [roundPhase, setRoundPhase] = useState('stimulus'); // 'stimulus' | 'feedback'
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'correct' | 'incorrect' | 'timeout'
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [roundCounter, setRoundCounter] = useState(0);

  // Timers and references
  const stimulusTimestampRef = useRef(0);
  const timeoutsRef = useRef([]);
  const isComponentActive = useRef(isActive);
  const hasAnsweredRef = useRef(false);
  const consecutiveRoundsInRule = useRef(0);

  // Sync active ref
  useEffect(() => {
    isComponentActive.current = isActive;
    if (!isActive) {
      clearAllTimers();
    } else if (roundPhase === 'stimulus' && stimulus === null) {
      generateRound();
    }
  }, [isActive]);

  const clearAllTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    AsyncStorage.getItem('cognify:tutorial:contextSwitch').then((val) => {
      if (!val) {
        setShowTutorial(true);
      }
    });
    return () => clearAllTimers();
  }, []);

  const generateRound = () => {
    if (!isComponentActive.current) return;
    
    clearAllTimers();
    hasAnsweredRef.current = false;
    setSelectedAnswer(null);
    setRoundPhase('stimulus');
    setFeedbackStatus(null);

    // 1. Determine active rule based on difficulty and switch frequency
    let nextRule = currentRule;
    const rules = config.activeRules;

    const shouldSwitch = () => {
      if (config.switchFrequency === 'random') {
        // Switch randomly every 1 to 3 rounds
        return consecutiveRoundsInRule.current >= Math.floor(Math.random() * 3 + 1);
      } else {
        // Switch every N rounds
        return consecutiveRoundsInRule.current >= config.switchFrequency;
      }
    };

    if (shouldSwitch()) {
      consecutiveRoundsInRule.current = 0;
      const otherRules = rules.filter(r => r !== currentRule);
      nextRule = otherRules[Math.floor(Math.random() * otherRules.length)];
    } else {
      consecutiveRoundsInRule.current += 1;
    }

    setPrevRule(currentRule);
    setCurrentRule(nextRule);

    // 2. Generate shape properties while satisfying fill guard
    const shape = Math.random() > 0.5 ? 'circle' : 'square';
    const size = Math.random() > 0.5 ? 'large' : 'small';
    const count = Math.random() > 0.5 ? 2 : 1;
    
    // Fill color guard: fill must NEVER match active border color
    // active rule border color map in config:
    // BLUE (#185FA5) for shape, RED (#E24B4A) for colour, etc.
    let color = Math.random() > 0.5 ? 'red' : 'blue';
    if (nextRule === 'shape' && color === 'blue') {
      color = 'red';
    } else if (nextRule === 'colour' && color === 'red') {
      color = 'blue';
    }

    const nextStimulus = { shape, color, size, count };
    setStimulus(nextStimulus);

    stimulusTimestampRef.current = Date.now();

    // 3. Response window limit
    const responseTimeout = setTimeout(() => {
      if (!isComponentActive.current || hasAnsweredRef.current) return;
      handleAnswer(null); // Timeout
    }, config.responseWindow);

    timeoutsRef.current.push(responseTimeout);
  };

  const handlePressOption = (option) => {
    if (roundPhase !== 'stimulus' || hasAnsweredRef.current || !isComponentActive.current) return;
    handleAnswer(option);
  };

  const handleAnswer = (option) => {
    hasAnsweredRef.current = true;
    setSelectedAnswer(option);
    
    const responseTime = Date.now() - stimulusTimestampRef.current;
    const isSwitchRound = prevRule !== null && currentRule !== prevRule;

    // Check correctness
    let isCorrect = false;
    let expectedAnswer = '';

    if (currentRule === 'shape') {
      expectedAnswer = stimulus.shape; // 'circle' | 'square'
    } else if (currentRule === 'colour') {
      expectedAnswer = stimulus.color; // 'red' | 'blue'
    } else if (currentRule === 'size') {
      expectedAnswer = stimulus.size; // 'large' | 'small'
    } else if (currentRule === 'count') {
      expectedAnswer = stimulus.count === 2 ? 'two' : 'one';
    }

    isCorrect = option === expectedAnswer;
    setFeedbackStatus(isCorrect ? 'correct' : (option === null ? 'timeout' : 'incorrect'));
    setRoundPhase('feedback');

    // Scoring params
    const baseScore = isCorrect ? (isSwitchRound ? 150 : 100) : 0;
    const maxScore = isSwitchRound ? 150 : 100;

    // Invoke callback
    onRoundComplete({
      isCorrect,
      scoreProps: {
        baseScore,
        speedBonus: 0,
        maxScore,
      },
      metrics: {
        reactionTimeMs: responseTime,
        isSwitchRound,
      },
    });

    // Increment tutorial round tracking
    if (showTutorial) {
      const nextCount = roundCounter + 1;
      setRoundCounter(nextCount);
      if (nextCount >= 5) {
        setShowTutorial(false);
        AsyncStorage.setItem('cognify:tutorial:contextSwitch', 'true');
      }
    }

    // Feedback duration (400ms)
    const feedbackTimeout = setTimeout(() => {
      if (!isComponentActive.current) return;
      setStimulus(null);
      generateRound();
    }, CONTEXT_SWITCH.FEEDBACK_DURATION_MS);

    timeoutsRef.current.push(feedbackTimeout);
  };

  // Rule configuration details
  const ruleSpec = CONTEXT_SWITCH.RULES[currentRule] || CONTEXT_SWITCH.RULES.shape;
  const buttonLabels = ruleSpec.buttons; // e.g. ['circle', 'square']

  // SVG stimulus drawing
  const renderStimulusShape = (scale = 1.0) => {
    if (!stimulus) return null;

    const fill = COLOR_MAP[stimulus.color];
    const isLarge = stimulus.size === 'large';
    const dim = isLarge ? 48 * scale : 28 * scale;

    const drawSingleShape = (key) => {
      if (stimulus.shape === 'circle') {
        return (
          <Svg key={key} width={56} height={56} viewBox="0 0 50 50">
            <Circle cx="25" cy="25" r={dim / 2} fill={fill} />
          </Svg>
        );
      } else {
        return (
          <Svg key={key} width={56} height={56} viewBox="0 0 50 50">
            <Rect x={25 - dim / 2} y={25 - dim / 2} width={dim} height={dim} fill={fill} />
          </Svg>
        );
      }
    };

    if (stimulus.count === 2) {
      return (
        <View style={styles.shapesRow}>
          {drawSingleShape(1)}
          {drawSingleShape(2)}
        </View>
      );
    }

    return drawSingleShape(0);
  };

  const getCorrectGlowColor = () => {
    if (feedbackStatus === 'correct') return '#3DC27A'; // Headspace success green
    if (feedbackStatus === 'incorrect' || feedbackStatus === 'timeout') return '#E24B4A'; // Red glow
    return 'transparent';
  };

  return (
    <View style={styles.container}>
      {/* Target Stimulus Card */}
      {stimulus && (
        <View style={[
          styles.stimulusCard, 
          Shadow.md,
          { 
            borderColor: getCorrectGlowColor() !== 'transparent' ? getCorrectGlowColor() : ruleSpec.borderColour,
            borderWidth: 4,
          }
        ]}>
          {renderStimulusShape()}
        </View>
      )}

      {/* Response Action Buttons */}
      <View style={styles.buttonsRow}>
        {buttonLabels.map((lbl, idx) => {
          const isSelected = selectedAnswer === lbl;
          const isCorrectAns = stimulus && (
            (currentRule === 'shape' && stimulus.shape === lbl) ||
            (currentRule === 'colour' && stimulus.color === lbl) ||
            (currentRule === 'size' && stimulus.size === lbl) ||
            (currentRule === 'count' && (stimulus.count === 2 ? 'two' : 'one') === lbl)
          );

          // Correct highlight coloring on error
          let buttonBg = Colors.surfaceAlt;
          let textColors = Colors.textSecondary;

          if (roundPhase === 'feedback') {
            if (isCorrectAns) {
              buttonBg = '#3DC27A'; // Headspace success green
              textColors = Colors.textInverse;
            } else if (isSelected) {
              buttonBg = '#E24B4A'; // Glow wrong tapped answer in red
              textColors = Colors.textInverse;
            }
          }

          return (
            <TouchableOpacity
              key={lbl}
              style={[
                styles.optionBtn, 
                Shadow.sm,
                { backgroundColor: buttonBg }
              ]}
              onPress={() => handlePressOption(lbl)}
              disabled={roundPhase === 'feedback' || !isActive}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionBtnText, { color: textColors }]}>{lbl}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend Strip Tutorial */}
      {showTutorial && (
        <View style={[styles.legendStrip, Shadow.sm]}>
          {config.activeRules.map((ruleName) => {
            const ruleColor = CONTEXT_SWITCH.RULES[ruleName].borderColour;
            return (
              <View key={ruleName} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: ruleColor }]} />
                <Text style={[styles.legendLabel, { color: Colors.textSecondary }]}>{ruleName}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    gap: Spacing[8],
  },
  stimulusCard: {
    backgroundColor: '#FFFFFF',
    width: 140,
    height: 140,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shapesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing[4],
  },
  optionBtn: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
  },
  legendStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[4],
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[5],
    borderRadius: Radius.full,
    position: 'absolute',
    bottom: Spacing[8],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
  },
});
