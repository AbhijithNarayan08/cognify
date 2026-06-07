import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useThemeColors, Typography, Motion } from '../../theme';
import { t } from '../../constants/useStrings';

const RING_SIZE = 180;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Score range: 400–1000
function scoreToProgress(score) {
  return Math.max(0, Math.min(1, (score - 400) / 600));
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ScoreRing({ score = 0, delta = null, size = RING_SIZE, animated = true }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  
  const progress = scoreToProgress(score);
  const animValue = useRef(new Animated.Value(0)).current;
  const counterValue = useRef(new Animated.Value(400)).current;
  const [displayScore, setDisplayScore] = React.useState(400);

  useEffect(() => {
    if (!animated) {
      animValue.setValue(progress);
      setDisplayScore(score);
      return;
    }
    Animated.timing(animValue, {
      toValue: progress,
      duration: Motion.breath,
      useNativeDriver: false,
    }).start();

    const listener = counterValue.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });
    Animated.timing(counterValue, {
      toValue: score,
      duration: Motion.breath,
      useNativeDriver: false,
    }).start();
    return () => counterValue.removeListener(listener);
  }, [score]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const scale = size / RING_SIZE;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      >
        <Circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          stroke={Colors.border}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeOpacity={0.35}
        />
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={RADIUS}
            stroke={Colors.brandPrimary}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>

      <View style={styles.innerContent}>
        <Text style={styles.scoreText}>{displayScore}</Text>
        <Text style={styles.scoreLabel}>{t('home.scoreRing.score')}</Text>
        {delta !== null && (
          <Text style={[
            styles.deltaText,
            { color: delta >= 0 ? Colors.coral : Colors.warning }
          ]}>
            {t('home.scoreRing.deltaToday', { delta: delta >= 0 ? `+${delta}` : delta })}
          </Text>
        )}
      </View>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.display,
    color: Colors.textPrimary,
    lineHeight: 48,
  },
  scoreLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  deltaText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    marginTop: 2,
  },
});
