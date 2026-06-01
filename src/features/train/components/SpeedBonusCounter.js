// src/features/train/components/SpeedBonusCounter.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { Typography, Spacing, Radius } from '../../../theme';

export default function SpeedBonusCounter({ count, Colors }) {
  if (count === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: '#FFF9E6', borderColor: '#F4A041' }]}>
      <Zap size={18} color="#F4A041" fill="#F4A041" />
      <Text style={[styles.text, { color: '#B36B00' }]}>
        {count} Elite Speed {count === 1 ? 'Bonus' : 'Bonuses'} Earned!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: Spacing[2],
    marginVertical: Spacing[2],
    alignSelf: 'center',
  },
  text: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
  },
});
