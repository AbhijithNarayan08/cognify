// src/features/train/games/SignalChain/RoundIndicator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing } from '../../../../theme';
import { t } from '../../../../constants/useStrings';

export default function RoundIndicator({ roundNumber, sequenceLength, Colors }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.roundText, { color: Colors.textSecondary }]}>
        {t('train.signalChain.round', { count: roundNumber })}
      </Text>
      <Text style={[styles.nodesText, { color: Colors.textTertiary }]}>
        {t('train.signalChain.nodes', { count: sequenceLength })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing[2],
  },
  roundText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    textAlign: 'center',
  },
  nodesText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    textAlign: 'center',
    marginTop: 2,
  },
});
