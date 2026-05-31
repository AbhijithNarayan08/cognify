// src/features/train/games/LighthouseWatch/LighthouseWatchTapZone.js
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

/**
 * LighthouseWatchTapZone covers the active canvas area to capture low-latency taps.
 * @param {{ isActive: boolean, onTap: (timestamp: number) => void }} props
 */
export default function LighthouseWatchTapZone({ isActive, onTap }) {
  const handlePress = () => {
    if (!isActive) return;
    onTap(Date.now());
  };

  return (
    <TouchableOpacity
      style={StyleSheet.absoluteFillObject}
      activeOpacity={1.0}
      onPress={handlePress}
      disabled={!isActive}
      accessibilityRole="button"
      accessibilityLabel="Tap For Star"
    />
  );
}
