// src/features/train/games/FlashSort/FlashSortFixation.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';

export default function FlashSortFixation({ Colors }) {
  const color = Colors.textTertiary || '#8E8A86';
  const size = 24;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Horizontal Line */}
        <Line
          x1={0}
          y1={size / 2}
          x2={size}
          y2={size / 2}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Vertical Line */}
        <Line
          x1={size / 2}
          y1={0}
          x2={size / 2}
          y2={size}
          stroke={color}
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
