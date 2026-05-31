// src/features/train/games/SignalChain/ResponseWindowBar.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing } from '../../../../theme';

export default function ResponseWindowBar({ progress, Colors }) {
  // progress is between 0.0 and 1.0
  const widthPercentage = `${Math.max(0, Math.min(100, progress * 100))}%`;

  return (
    <View style={[styles.container, { backgroundColor: Colors.border }]}>
      <View
        style={[
          styles.fill,
          {
            width: widthPercentage,
            backgroundColor: Colors.textTertiary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    overflow: 'hidden',
    marginVertical: Spacing[3],
  },
  fill: {
    height: '100%',
  },
});
