import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../context/AppContext';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';

const QUESTIONS = [
  {
    key: 'ageRange',
    questionKey: 'onboarding.quickProfile.ageQuestion',
    optionsKeys: [
      'onboarding.quickProfile.ageOption.0',
      'onboarding.quickProfile.ageOption.1',
      'onboarding.quickProfile.ageOption.2',
      'onboarding.quickProfile.ageOption.3',
      'onboarding.quickProfile.ageOption.4',
      'onboarding.quickProfile.ageOption.5',
    ],
    options: ['18–25', '26–35', '36–45', '46–55', '56–65', '65+'],
  },
  {
    key: 'avgSleepBucket',
    questionKey: 'onboarding.quickProfile.sleepQuestion',
    optionsKeys: [
      'onboarding.quickProfile.sleepOption.0',
      'onboarding.quickProfile.sleepOption.1',
      'onboarding.quickProfile.sleepOption.2',
      'onboarding.quickProfile.sleepOption.3',
      'onboarding.quickProfile.sleepOption.4',
    ],
    options: ['under 5 hours', '5–6 hours', '6–7 hours', '7–8 hours', '8+ hours'],
  },
  {
    key: 'activityLevel',
    questionKey: 'onboarding.quickProfile.activityQuestion',
    optionsKeys: [
      'onboarding.quickProfile.activityOption.0',
      'onboarding.quickProfile.activityOption.1',
      'onboarding.quickProfile.activityOption.2',
      'onboarding.quickProfile.activityOption.3',
    ],
    options: ['rarely', 'a few times a week', 'most days', 'every day'],
  },
];

export default function QuickProfileScreen({ navigation }) {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const animateTransition = (cb) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleOption = (value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'SET_PROFILE', payload: { [QUESTIONS[step].key]: value } });

    if (step < QUESTIONS.length - 1) {
      animateTransition(() => setStep(step + 1));
    } else {
      navigation.navigate('AssessmentIntro');
    }
  };

  const q = QUESTIONS[step];

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {QUESTIONS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
          />
        ))}
      </View>

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <Text style={styles.question}>{t(q.questionKey)}</Text>
        <View style={styles.options}>
          {q.options.map((opt, idx) => (
            <TouchableOpacity
              key={opt}
              style={[styles.option, Shadow.sm]}
              onPress={() => handleOption(opt)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{t(q.optionsKeys[idx])}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {step > 0 && (
        <TouchableOpacity
          onPress={() => animateTransition(() => setStep(step - 1))}
          style={styles.back}
        >
          <Text style={styles.backText}>{t('onboarding.quickProfile.back')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
    paddingHorizontal: Spacing[6],
    paddingTop: 72,
    paddingBottom: Spacing[8],
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[8],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.brandPrimary,
    width: 20,
  },
  dotDone: {
    backgroundColor: Colors.brandPrimary,
    opacity: 0.5,
  },
  question: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    textTransform: 'lowercase',
    lineHeight: 36,
    marginBottom: Spacing[8],
  },
  options: {
    gap: Spacing[3],
  },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
  },
  optionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textPrimary,
    textTransform: 'lowercase',
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing[2],
  },
  backText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
  },
});
