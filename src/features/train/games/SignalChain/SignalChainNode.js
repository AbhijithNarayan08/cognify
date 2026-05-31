// src/features/train/games/SignalChain/SignalChainNode.js
import React, { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Shadow, Typography } from '../../../../theme';

export default function SignalChainNode({
  index,
  row,
  col,
  size,
  isActive,
  isCorrectFlash,
  isErrorFlash,
  feedbackColor,
  onPress,
  disabled,
  Colors,
  nodePoints,
  isTappedCorrectly,
}) {
  const scaleAnim = useRef(new Animated.Value(1.0)).current;
  const opacityAnim = useRef(new Animated.Value(0.2)).current;

  // Floating text animation values
  const floatAnim = useRef(new Animated.Value(0)).current; // translateY
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const [showFloat, setShowFloat] = useState(false);

  const domainColor = Colors.domain?.memory?.main || '#0073E6';

  useEffect(() => {
    if (isActive) {
      // Pulse animation: scale to 1.08 and back, fade in to full opacity
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 1.0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isCorrectFlash) {
      // Correct feedback animation (green, scale 1.12)
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.12,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 1.0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isErrorFlash) {
      // Incorrect feedback animation (orange, scale 1.12)
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.12,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 1.0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Instant snap back to neutral
      scaleAnim.setValue(1.0);
      opacityAnim.setValue(0.2);
    }
  }, [isActive, isCorrectFlash, isErrorFlash]);

  // Trigger floating points when the node is correctly tapped
  useEffect(() => {
    if (isTappedCorrectly) {
      setShowFloat(true);
      floatAnim.setValue(0);
      floatOpacity.setValue(1);

      Animated.parallel([
        Animated.timing(floatAnim, {
          toValue: -24,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(floatOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowFloat(false);
      });
    }
  }, [isTappedCorrectly]);

  // Determine background and border colors
  let nodeBg = domainColor;
  let borderColor = domainColor;

  if (isCorrectFlash) {
    nodeBg = '#3DC27A';
    borderColor = '#3DC27A';
  } else if (isErrorFlash) {
    nodeBg = '#F4A041';
    borderColor = '#F4A041';
  } else if (feedbackColor) {
    nodeBg = feedbackColor;
    borderColor = feedbackColor;
  }

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  const floatStyle = {
    transform: [{ translateY: floatAnim }],
    opacity: floatOpacity,
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.node,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: nodeBg,
              borderColor: borderColor,
              borderWidth: 2,
              ...Shadow.sm,
            },
          ]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.7}
          accessibilityLabel={`node ${row} ${col}`}
        />
      </Animated.View>

      {showFloat && (
        <Animated.View style={[styles.floatingTextContainer, floatStyle]}>
          <Text style={[styles.floatingText, { color: domainColor }]}>
            +{nodePoints}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTextContainer: {
    position: 'absolute',
    top: 0,
    zIndex: 99,
  },
  floatingText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
