// src/features/train/games/SignalChain/SignalChainFeedback.js
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Typography } from '../../../../theme';

export default function SignalChainFeedback({ scoreDelta, visible, Colors }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && scoreDelta > 0) {
      floatAnim.setValue(0);
      opacityAnim.setValue(1);

      Animated.parallel([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scoreDelta]);

  if (!visible || scoreDelta <= 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: floatAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={[styles.text, { color: '#3DC27A' }]}>+{scoreDelta}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -20,
    right: 20,
    zIndex: 100,
  },
  text: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 20,
  },
});
