// src/features/train/components/SpatialEfficiencyBadge.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, Radius, Shadow } from '../../../theme';
import { t } from '../../../constants/useStrings';

export default function SpatialEfficiencyBadge({ score, prevScore, isNewBest, Colors }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [score]);

  // Delta calculation
  let deltaText = '';
  let deltaColor = Colors.textMuted || '#888';
  if (prevScore !== null && prevScore !== undefined) {
    const diff = score - prevScore;
    if (diff > 0) {
      deltaText = t('patternFold.efficiencyBadge.vsLastPositive', { diff });
      deltaColor = '#3DC27A'; // green
    } else if (diff < 0) {
      deltaText = t('patternFold.efficiencyBadge.vsLastNegative', { diff });
      deltaColor = '#E24B4A'; // red
    } else {
      deltaText = t('patternFold.efficiencyBadge.vsLastEqual');
    }
  } else {
    deltaText = t('patternFold.efficiencyBadge.vsLastFirst');
  }

  return (
    <View style={[styles.card, Shadow.md, { backgroundColor: Colors.surface }]}>
      <View style={styles.badgeContainer}>
        {/* Animated Score Number */}
        <Animated.Text style={[styles.scoreText, { color: Colors.domain.spatial.main }]}>
          {animatedValue.interpolate({
            inputRange: [0, 100],
            outputRange: ['0', '100'],
            extrapolate: 'clamp',
          })}
        </Animated.Text>
        <Text style={[styles.label, { color: Colors.textSecondary }]}>{t('patternFold.efficiencyBadge.title')}</Text>
      </View>

      {/* Delta Indicator */}
      <View style={styles.deltaContainer}>
        <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaText}</Text>
      </View>

      {/* New Best Indicator */}
      {isNewBest && (
        <View style={[styles.bestBadge, { backgroundColor: Colors.domain.spatial.main }]}>
          <Text style={styles.bestBadgeText}>{t('patternFold.efficiencyBadge.newBest')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[5],
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: Spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  badgeContainer: {
    alignItems: 'center',
    marginVertical: Spacing[2],
  },
  scoreText: {
    fontSize: 54,
    fontFamily: Typography.fontFamily.bold,
    lineHeight: 60,
    letterSpacing: -1,
  },
  label: {
    fontSize: Typography.size.caption,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: Spacing[1],
  },
  deltaContainer: {
    marginTop: Spacing[2],
  },
  deltaText: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.medium,
  },
  bestBadge: {
    marginTop: Spacing[3],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
  },
  bestBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
