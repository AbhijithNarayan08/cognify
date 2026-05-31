// src/features/train/games/LighthouseWatch/LighthouseWatchFeedback.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing } from '../../../../theme';

/**
 * LighthouseWatchFeedback renders the full-screen overlays, error labels, and score deltas.
 * @param {{ activeFeedback: { type: string, points?: number, id?: number }, Colors: object }} props
 */
export default function LighthouseWatchFeedback({ activeFeedback, Colors }) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const deltaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activeFeedback) return;

    if (activeFeedback.type === 'false_alarm') {
      // 400ms red screen flash
      flashAnim.setValue(1);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }

    // Score delta animation (400ms translation)
    deltaAnim.setValue(0);
    Animated.timing(deltaAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

  }, [activeFeedback]);

  if (!activeFeedback) return null;

  const { type, points } = activeFeedback;

  // Render floating score delta
  const renderScoreDelta = () => {
    if (points === undefined || points === 0) return null;

    const isPositive = points > 0;
    const deltaText = isPositive ? `+${points}` : `${points}`;
    const deltaColor = isPositive ? '#A662C6' : '#E24B4A'; // Purple for Hits, Red for FA

    const translateY = deltaAnim.interpolate({
      inputRange: [0, 1],
      outputRange: isPositive ? [0, -20] : [0, 20], // Translate up for hit, down for false alarm
    });

    const opacity = deltaAnim.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 1, 1, 0],
    });

    return (
      <Animated.View style={[
        styles.deltaContainer,
        {
          opacity,
          transform: [{ translateY }],
        }
      ]}>
        <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaText}</Text>
      </Animated.View>
    );
  };

  // Render instructional feedback captions
  const renderCaption = () => {
    if (type === 'miss') {
      return (
        <View style={styles.captionContainer}>
          <Text style={[styles.captionText, { color: Colors.textMuted }]}>missed</Text>
        </View>
      );
    }
    if (type === 'false_alarm') {
      return (
        <View style={styles.captionContainer}>
          <Text style={[styles.captionText, { color: '#E24B4A', fontFamily: Typography.fontFamily.bold }]}>
            too fast — that wasn't the star
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Full-screen False Alarm red flash */}
      {type === 'false_alarm' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.flashOverlay,
            {
              opacity: flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.08], // Max 8% opacity
              }),
            },
          ]}
        />
      )}

      {renderScoreDelta()}
      {renderCaption()}
    </View>
  );
}

const styles = StyleSheet.create({
  flashOverlay: {
    backgroundColor: '#E24B4A',
  },
  deltaContainer: {
    position: 'absolute',
    top: 64, // Positioned near the header score display
    right: 24,
    zIndex: 999,
  },
  deltaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body + 2,
  },
  captionContainer: {
    position: 'absolute',
    top: '60%', // Centered horizontally below the active streaming icon
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  captionText: {
    fontSize: Typography.size.caption,
    textAlign: 'center',
  },
});
