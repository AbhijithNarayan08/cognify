// src/features/train/games/FlashSort/FlashSortFeedback.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import FlashSortShape from './FlashSortShape';
import { Typography, Spacing } from '../../../../theme';
import { t } from '../../../../constants/useStrings';

export default function FlashSortFeedback({
  status,
  shapeType,
  distractorType,
  color,
  Colors,
}) {
  const opacityAnim = useRef(new Animated.Value(1.0)).current;

  useEffect(() => {
    if (status === 'false_start') {
      // Opacity flicker: 1.0 -> 0.3 -> 1.0 over 200ms
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1.0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacityAnim.setValue(1.0);
    }
  }, [status]);

  let feedbackColor = null;
  let labelText = '';
  let customStyle = {};

  if (status === 'correct') {
    feedbackColor = '#3DC27A';
  } else if (status === 'incorrect') {
    feedbackColor = '#E24B4A';
  } else if (status === 'too_slow') {
    feedbackColor = Colors.textTertiary || '#8E8A86';
    labelText = t('train.flashSort.feedback.tooSlow');
  } else if (status === 'false_start') {
    feedbackColor = Colors.textTertiary || '#8E8A86';
    labelText = t('train.flashSort.feedback.tooFast');
  }

  const animatedStyle = {
    opacity: opacityAnim,
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[animatedStyle, customStyle]}>
        <FlashSortShape
          shapeType={shapeType}
          distractorType={distractorType}
          color={color}
          Colors={Colors}
          feedbackColor={feedbackColor}
        />
      </Animated.View>
      {labelText ? (
        <Text style={[styles.caption, { color: Colors.textTertiary }]}>
          {labelText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  caption: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    textAlign: 'center',
    marginTop: Spacing[4],
  },
});
