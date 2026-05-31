/**
 * useSessionEngine — manages the full lifecycle of a brain training session.
 *
 * Extracted from ActiveSessionScreen to separate state machine logic
 * from presentation. The screen just renders what this hook provides.
 *
 * Phases: 'intro' → 'playing' → 'transition' → 'intro' → ... → 'complete'
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../../context/AppContext';
import { completeWorkout } from '../../../store/actions';

export function useSessionEngine(exercises) {
  const { dispatch } = useApp();

  const [exIndex, setExIndex]         = useState(0);
  const [phase, setPhase]             = useState('intro'); // 'intro'|'playing'|'transition'|'complete'
  const [timeLeft, setTimeLeft]       = useState(exercises[0]?.duration || 60);
  const [trialIdx, setTrialIdx]       = useState(0);
  const [correct, setCorrect]         = useState(0);
  const [feedback, setFeedback]       = useState(null); // 'correct'|'wrong'|null
  const [sessionScores, setSessionScores] = useState([]);

  const timerRef    = useRef(null);
  const fadeAnim    = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim   = useRef(new Animated.Value(0)).current;

  const currentEx = exercises[exIndex];

  // Sync timeLeft when current exercise changes/loads
  useEffect(() => {
    if (currentEx && phase === 'intro') {
      setTimeLeft(currentEx.duration);
    }
  }, [currentEx, phase]);

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  const startExercise = useCallback(() => {
    setPhase('playing');
    setTimeLeft(currentEx.duration);
    setTrialIdx(0);
    setCorrect(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: currentEx.duration * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // eslint-disable-next-line no-use-before-define
          finishExercise();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [currentEx, exIndex]);

  const finishExercise = useCallback(() => {
    clearInterval(timerRef.current);
    progressAnim.setValue(0);

    const accuracy = correct / Math.max(1, trialIdx);
    const score    = Math.round(500 + accuracy * 350 + Math.random() * 50);
    const delta    = Math.round(10 + accuracy * 30);

    setSessionScores(prev => [...prev, { exercise: currentEx, score, delta }]);

    if (exIndex < exercises.length - 1) {
      setPhase('transition');
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          setExIndex(i => i + 1);
          setPhase('intro');
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
      }, 1500);
    } else {
      setPhase('complete');
      dispatch(completeWorkout());
      Animated.spring(scoreAnim, {
        toValue: 1, useNativeDriver: true, tension: 50, friction: 8,
      }).start();
    }
  }, [correct, trialIdx, currentEx, exIndex, exercises.length]);

  const handleResponse = useCallback((isCorrect) => {
    Haptics.impactAsync(
      isCorrect ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy,
    );
    if (isCorrect) setCorrect(c => c + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTrialIdx(t => t + 1);
    setTimeout(() => setFeedback(null), 200);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return {
    // State
    currentEx,
    exIndex,
    phase,
    timeLeft,
    trialIdx,
    correct,
    feedback,
    sessionScores,
    // Animations
    fadeAnim,
    progressAnim,
    progressWidth,
    scoreAnim,
    // Actions
    startExercise,
    finishExercise,
    handleResponse,
  };
}
