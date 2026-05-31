// src/features/train/components/SessionTimerBar.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SessionTimerBar({ activeTimeElapsed, totalDuration, pulse = false }) {
  const widthPercent = Math.max(0, 1 - activeTimeElapsed / totalDuration) * 100;
  
  const opacityAnim = useRef(new Animated.Value(1.0)).current;
  const lastPulseIntervalRef = useRef(0);

  useEffect(() => {
    if (!pulse) {
      opacityAnim.setValue(1.0);
      return;
    }

    // Trigger a pulse animation every 15 seconds (15000ms) of active time
    const currentInterval = Math.floor(activeTimeElapsed / 15000);
    if (currentInterval > 0 && currentInterval !== lastPulseIntervalRef.current) {
      lastPulseIntervalRef.current = currentInterval;
      
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1.0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTimeElapsed, pulse]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: `${widthPercent}%`,
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 3,
    backgroundColor: '#E8E8E8', // Neutral border/track color
  },
  fill: {
    height: '100%',
    backgroundColor: '#FFC000', // Speed yellow domain color for neutral timer bar
  },
});
