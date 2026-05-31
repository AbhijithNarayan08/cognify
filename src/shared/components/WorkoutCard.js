import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';
import { TouchableScale } from '../motion/Motion';
import { t } from '../../constants/useStrings';

/**
 * WorkoutCard — shows today's workout summary and start CTA.
 * @param {{ exercises: Array, onStart: function, isComplete?: boolean, inProgress?: boolean }} props
 */
export function WorkoutCard({ exercises = [], onStart, isComplete = false, inProgress = false }) {
  const Colors = useThemeColors();
  const DOMAINS = getDomains(Colors);
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  return (
    <View style={[styles.card, Shadow.md]}>
      <View style={styles.header}>
        <Text style={styles.label}>{t('home.workoutCard.todayWorkout')}</Text>
        <Text style={styles.title}>{t('home.workoutCard.meta', { count: exercises.length })}</Text>
      </View>
      <View style={styles.exerciseList}>
        {exercises.slice(0, 4).map((ex) => {
          const domain = DOMAINS.find(d => d.id === ex.domain);
          return (
            <View key={ex.id} style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: domain?.color.main }]} />
              <Text style={styles.chipLabel}>{ex.name}</Text>
            </View>
          );
        })}
      </View>
      {isComplete ? (
        <View style={styles.completeRow}>
          <Check size={14} color="#3DC27A" style={{ marginRight: 6 }} />
          <Text style={styles.completeText}>{t('home.workoutCard.complete')}</Text>
        </View>
      ) : (
        <TouchableScale
          style={styles.cta}
          onPress={onStart}
        >
          <Text style={styles.ctaText}>
            {inProgress ? t('home.workoutCard.continue') : t('home.workoutCard.start')}
          </Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableScale>
      )}
    </View>
  );
}

const NAVY = '#1D2340';

const getStyles = (Colors) => StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[6],
    backgroundColor: NAVY,
  },
  header: { marginBottom: Spacing[4] },
  label: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: 6,
  },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h2,
    color: '#FFFFFF',
    letterSpacing: Typography.letterSpacing.h1,
  },
  exerciseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    gap: 6,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: 'rgba(255,255,255,0.90)',
  },
  cta: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: Radius.full,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: '#FFFFFF',
  },
  ctaArrow: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: '#FFFFFF',
  },
  completeRow: {
    backgroundColor: 'rgba(61,194,122,0.15)',
    borderRadius: Radius.full,
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  completeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: '#3DC27A',
  },
});
