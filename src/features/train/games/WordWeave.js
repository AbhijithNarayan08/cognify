// src/features/train/games/WordWeave.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { WORD_WEAVE_ANALOGIES } from '../../../data/wordWeaveAnalogies';
import { WORD_WEAVE } from '../../../constants/gameConfig';
import { Typography, Spacing, Radius } from '../../../theme';

export default function WordWeave({ level, isActive, onRoundComplete, Colors }) {
  const config = WORD_WEAVE.levels[level] || WORD_WEAVE.levels[1];

  // Game state
  const [analogy, setAnalogy] = useState(null);
  const [shuffledChoices, setShuffledChoices] = useState([]);
  const [roundPhase, setRoundPhase] = useState('think'); // 'think' | 'stimulus' | 'feedback'
  const [selectedWord, setSelectedWord] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'correct' | 'incorrect' | 'timeout'

  // Animations
  const choicesOpacity = useRef(new Animated.Value(0)).current;

  // Refs for tracking timestamps & timeouts
  const choiceTimestampRef = useRef(0);
  const timeoutsRef = useRef([]);
  const isComponentActive = useRef(isActive);
  const hasAnsweredRef = useRef(false);

  // Filter analogies by level
  const analogiesList = useMemo(() => {
    return WORD_WEAVE_ANALOGIES.filter((a) => a.level === level);
  }, [level]);

  // Sync active ref
  useEffect(() => {
    isComponentActive.current = isActive;
    if (!isActive) {
      clearAllTimers();
    } else if (roundPhase === 'think' && analogy === null) {
      generateRound();
    }
  }, [isActive]);

  const clearAllTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const generateRound = () => {
    if (!isComponentActive.current) return;
    
    clearAllTimers();
    hasAnsweredRef.current = false;
    setSelectedWord(null);
    setFeedbackStatus(null);
    choicesOpacity.setValue(0);
    setRoundPhase('think');

    // Pick a random analogy
    const randIdx = Math.floor(Math.random() * analogiesList.length);
    const item = analogiesList[randIdx];
    setAnalogy(item);

    // Shuffle choices
    const choices = [item.bridgeWord, ...item.distractors];
    const shuffled = choices.sort(() => Math.random() - 0.5);
    setShuffledChoices(shuffled);

    // Schedule thinkTime delay
    const thinkTimeout = setTimeout(() => {
      if (!isComponentActive.current) return;
      
      setRoundPhase('stimulus');
      choiceTimestampRef.current = Date.now();

      Animated.timing(choicesOpacity, {
        toValue: 1.0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Stimulus response window timer
      const responseTimeout = setTimeout(() => {
        if (!isComponentActive.current || hasAnsweredRef.current) return;
        handleAnswer(null); // Timeout
      }, config.responseWindow);

      timeoutsRef.current.push(responseTimeout);
    }, config.thinkTime);

    timeoutsRef.current.push(thinkTimeout);
  };

  // Start round on level load
  useEffect(() => {
    if (isActive && analogy === null) {
      generateRound();
    }
  }, [isActive, level]);

  const handlePressChoice = (word) => {
    if (roundPhase !== 'stimulus' || hasAnsweredRef.current || !isComponentActive.current) return;
    handleAnswer(word);
  };

  const handleAnswer = (word) => {
    hasAnsweredRef.current = true;
    setSelectedWord(word);
    
    const responseTime = Date.now() - choiceTimestampRef.current;
    const isCorrect = word === analogy.bridgeWord;

    setFeedbackStatus(isCorrect ? 'correct' : (word === null ? 'timeout' : 'incorrect'));
    setRoundPhase('feedback');

    // Calculate score
    const baseScore = isCorrect ? 100 : 0;
    // Speed bonus: +25 if under 40% of responseWindow
    const speedBonus = isCorrect && responseTime < (config.responseWindow * WORD_WEAVE.SPEED_BONUS_THRESHOLD) 
      ? WORD_WEAVE.SPEED_BONUS_POINTS 
      : 0;

    // Invoke runner callback
    onRoundComplete({
      isCorrect,
      scoreProps: {
        baseScore,
        speedBonus,
        maxScore: 100,
      },
    });

    // Auto-advance after feedback duration (600ms)
    const feedbackTimeout = setTimeout(() => {
      if (!isComponentActive.current) return;
      setAnalogy(null);
      generateRound();
    }, WORD_WEAVE.FEEDBACK_DURATION_MS);

    timeoutsRef.current.push(feedbackTimeout);
  };

  return (
    <View style={styles.container}>
      {analogy && (
        <View style={styles.contentArea}>
          {/* Analogy Frame Card */}
          <View style={[styles.analogyCard, Shadow.sm]}>
            <Text style={[styles.analogyText, { color: Colors.textPrimary }]}>
              {analogy.wordA} :{' '}
              <Text style={{ color: Colors.brandPrimary }}>
                {roundPhase === 'feedback' && feedbackStatus !== 'timeout' ? analogy.bridgeWord : '[___]'}
              </Text>{' '}
              ::{' '}
              <Text style={{ color: Colors.brandPrimary }}>
                {roundPhase === 'feedback' && feedbackStatus !== 'timeout' ? analogy.bridgeWord : '[___]'}
              </Text>{' '}
              : {analogy.wordD}
            </Text>
          </View>

          {/* Answer Option Cards */}
          <Animated.View style={[styles.choicesContainer, { opacity: choicesOpacity }]}>
            {shuffledChoices.map((word) => {
              const isSelected = selectedWord === word;
              const isCorrectAns = word === analogy.bridgeWord;

              let cardBg = Colors.surface;
              let borderCol = Colors.border;
              let textCol = Colors.textPrimary;

              if (roundPhase === 'feedback') {
                if (isCorrectAns) {
                  cardBg = '#3DC27A'; // Headspace success green
                  borderCol = '#3DC27A';
                  textCol = Colors.textInverse;
                } else if (isSelected) {
                  cardBg = '#E24B4A'; // Selected incorrect turns red
                  borderCol = '#E24B4A';
                  textCol = Colors.textInverse;
                }
              }

              return (
                <TouchableOpacity
                  key={word}
                  style={[
                    styles.choiceCard,
                    Shadow.sm,
                    { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 }
                  ]}
                  onPress={() => handlePressChoice(word)}
                  disabled={roundPhase !== 'stimulus' || !isActive}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.choiceText, { color: textCol }]}>{word}</Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Explanation Text at the Bottom */}
          {roundPhase === 'feedback' && feedbackStatus !== 'timeout' && (
            <Text style={[styles.explanationText, { color: Colors.textMuted }]}>
              {analogy.explanation}
            </Text>
          )}
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
  },
  contentArea: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing[6],
  },
  analogyCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: Radius.lg,
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  analogyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
  },
  choicesContainer: {
    width: '100%',
    gap: Spacing[3],
  },
  choiceCard: {
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  choiceText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
  },
  explanationText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
    lineHeight: 20,
  },
});
