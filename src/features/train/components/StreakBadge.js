// src/features/train/components/StreakBadge.js
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Typography } from '../../../theme';

export default function StreakBadge({ multiplier, domainColour }) {
  const [visibleMultiplier, setVisibleMultiplier] = useState(1.0);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const prevMultiplierRef = useRef(1.0);

  useEffect(() => {
    const prev = prevMultiplierRef.current;
    prevMultiplierRef.current = multiplier;

    if (multiplier > 1.0) {
      if (prev === 1.0 || multiplier > prev) {
        setVisibleMultiplier(multiplier);
        scaleAnim.setValue(0.5);
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        setVisibleMultiplier(multiplier);
      }
    } else if (multiplier === 1.0 && prev > 1.0) {
      // Play shake animation, then hide
      scaleAnim.setValue(1.0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 4, duration: 25, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 25, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 25, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 25, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 25, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 25, useNativeDriver: true }),
      ]).start(() => {
        setVisibleMultiplier(1.0);
      });
    } else {
      setVisibleMultiplier(1.0);
    }
  }, [multiplier]);

  if (visibleMultiplier === 1.0) return null;

  // Format e.g. 1.1 -> "1.1", 1.25 -> "1.25", 1.5 -> "1.5"
  const formattedMultiplier = visibleMultiplier % 1 === 0 
    ? visibleMultiplier.toFixed(0) 
    : visibleMultiplier.toString();

  return (
    <Animated.Text
      style={[
        styles.badge,
        {
          color: domainColour || '#F4A041',
          transform: [
            { scale: scaleAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      ×{formattedMultiplier}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    textAlign: 'right',
  },
});
