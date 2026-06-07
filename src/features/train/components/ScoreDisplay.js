// src/features/train/components/ScoreDisplay.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Typography } from '../../../theme';
import { t } from '../../../constants/useStrings';

export default function ScoreDisplay({ score }) {
  const [deltas, setDeltas] = useState([]);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    const prev = prevScoreRef.current;
    prevScoreRef.current = score;

    const delta = score - prev;
    if (delta > 0) {
      const id = `${Date.now()}-${Math.random()}`;
      const animTranslate = new Animated.Value(0);
      const animOpacity = new Animated.Value(1.0);

      const newDelta = {
        id,
        val: delta,
        animTranslate,
        animOpacity,
      };

      setDeltas((prevDeltas) => [...prevDeltas, newDelta]);

      Animated.parallel([
        Animated.timing(animTranslate, {
          toValue: -24,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Clean up from state to prevent memory leaks
        setDeltas((prevDeltas) => prevDeltas.filter((d) => d.id !== id));
      });
    }
  }, [score]);

  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>{score}</Text>
      <Text style={styles.ptsLabel}>{t('train.activeSession.ptsLabel')}</Text>
      
      {/* Floating Deltas Container */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {deltas.map((d) => (
          <Animated.Text
            key={d.id}
            style={[
              styles.deltaText,
              {
                opacity: d.animOpacity,
                transform: [{ translateY: d.animTranslate }],
              },
            ]}
          >
            +{d.val}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  scoreText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.h2,
    color: '#1D2340', // Navy textPrimary
  },
  ptsLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.micro,
    color: '#8E8A86', // Muted text
    textAlign: 'right',
    marginTop: 1,
  },
  deltaText: {
    position: 'absolute',
    right: 0,
    top: -12,
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: '#3DC27A', // Headspace success green
  },
});
