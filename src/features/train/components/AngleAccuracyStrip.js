// src/features/train/components/AngleAccuracyStrip.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius } from '../../../theme';
import { t } from '../../../constants/useStrings';

export default function AngleAccuracyStrip({ angleAccuracy, Colors }) {
  const getPillTheme = (ratio) => {
    if (ratio === null || ratio === undefined) {
      return { bg: '#F0F0F0', text: '#888', label: t('patternFold.accuracyStrip.empty') };
    }
    const pct = Math.round(ratio * 100);
    if (pct >= 80) {
      return { bg: '#E6F5EE', text: '#3DC27A', label: `${pct}%` }; // Green
    }
    if (pct >= 65) {
      return { bg: '#FEF6E9', text: '#F4A041', label: `${pct}%` }; // Amber
    }
    return { bg: '#FFE8E7', text: '#E24B4A', label: `${pct}%` }; // Red
  };

  const angles = [90, 180, 270];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>{t('patternFold.accuracyStrip.rotationAngles')}</Text>
      <View style={styles.strip}>
        {angles.map((angle) => {
          const ratio = angleAccuracy ? angleAccuracy[angle] : null;
          const { bg, text, label } = getPillTheme(ratio);
          
          return (
            <View key={angle} style={[styles.pill, { backgroundColor: bg }]}>
              <Text style={[styles.angleLabel, { color: text }]}>{angle}°</Text>
              <Text style={[styles.accuracyLabel, { color: text }]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing[2],
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: Spacing[2],
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing[3],
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
  },
  angleLabel: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
  },
  accuracyLabel: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.semiBold,
  },
});
