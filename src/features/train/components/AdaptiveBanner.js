// src/features/train/components/AdaptiveBanner.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Typography, Spacing, Radius, Shadow } from '../../../theme';

export default function AdaptiveBanner({ suggestion, onAccept, onDismiss, Colors }) {
  if (!suggestion) return null;

  const isUp = suggestion.direction === 'UP';
  const Icon = isUp ? TrendingUp : TrendingDown;
  const accentColor = isUp ? '#3DC27A' : '#FEF6E9';
  const accentText = isUp ? '#3DC27A' : '#F4A041';
  
  return (
    <View style={[styles.card, Shadow.md, { backgroundColor: '#FFFFFF', borderColor: isUp ? '#3DC27A' : '#F4A041' }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: isUp ? '#E6F5EE' : '#FEF6E9' }]}>
          <Icon size={20} color={isUp ? '#3DC27A' : '#F4A041'} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>
            {isUp ? 'difficulty level up!' : 'difficulty adjustment'}
          </Text>
          <Text style={styles.bannerReason}>{suggestion.reason}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.secondaryBtn]}
          onPress={onDismiss}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, styles.secondaryBtnText]}>Not Yet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.primaryBtn, { backgroundColor: isUp ? '#3DC27A' : '#F4A041' }]}
          onPress={onAccept}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, styles.primaryBtnText]}>Let's Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    width: '100%',
    marginVertical: Spacing[3],
    borderWidth: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#333333',
  },
  bannerReason: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.medium,
    color: '#666666',
    marginTop: 2,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  btn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    minWidth: 100,
  },
  secondaryBtn: {
    backgroundColor: '#F5F5F5',
  },
  btnText: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
  },
  primaryBtnText: {
    color: '#FFFFFF',
  },
  secondaryBtnText: {
    color: '#666666',
  },
});
