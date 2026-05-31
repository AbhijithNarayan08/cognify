// src/shared/components/ExerciseCard.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';
import { TouchableScale } from '../motion/Motion';

/**
 * ExerciseCard — displays exercise details in the train tab grid.
 * @param {{ exercise: object, onPress: function, locked?: boolean, style?: object, showTooltip?: boolean, onDismissTooltip?: function }} props
 */
export function ExerciseCard({ exercise, onPress, locked = false, style, showTooltip = false, onDismissTooltip }) {
  const Colors = useThemeColors();
  const DOMAINS = getDomains(Colors);
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const domain = DOMAINS.find(d => d.id === exercise.domain);

  return (
    <TouchableScale
      style={[
        styles.card,
        { backgroundColor: domain?.color.light || Colors.surface },
        Shadow.sm,
        locked && styles.locked,
        style,
      ]}
      onPress={locked ? null : onPress}
    >
      {/* Tooltip Overlay */}
      {showTooltip && (
        <TouchableOpacity
          style={[styles.tooltip, Shadow.sm]}
          onPress={onDismissTooltip}
          activeOpacity={0.9}
        >
          <Text style={styles.tooltipText}>difficulty</Text>
          <View style={styles.tooltipArrow} />
        </TouchableOpacity>
      )}

      {/* Row 1: Domain Pill & Difficulty Dots */}
      <View style={styles.top}>
        <View style={[styles.domainChip, { backgroundColor: Colors.surface }]}>
          <Text style={[styles.domainLabel, { color: domain?.color.main }]}>
            {domain?.label}
          </Text>
        </View>
        <View style={styles.rightGroup}>
          {locked && <Lock size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />}
          <View style={styles.diffDots}>
            {[1, 2, 3].map(d => {
              const isFilled = d <= exercise.difficulty;
              return (
                <View
                  key={d}
                  style={[
                    styles.diffDot,
                    isFilled 
                      ? { backgroundColor: domain?.color.main }
                      : { borderWidth: 1.5, borderColor: domain?.color.main, backgroundColor: 'transparent' }
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>

      {/* Row 2: Exercise Name */}
      <Text style={[styles.name, { color: domain?.color.main || Colors.textPrimary }]}>
        {exercise.name}
      </Text>

      {/* Row 3: Description */}
      <Text style={styles.desc} numberOfLines={2}>
        {exercise.description}
      </Text>

      {/* Row 4: Duration */}
      <Text style={styles.duration}>
        {exercise.duration}s
      </Text>
    </TouchableScale>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  card: { 
    borderRadius: Radius.lg, 
    padding: Spacing[4], 
    minHeight: 160, 
    flex: 1,
    position: 'relative',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  domainChip: { borderRadius: Radius.md, paddingHorizontal: Spacing[2], paddingVertical: 4 },
  domainLabel: { fontFamily: Typography.fontFamily.bold, fontSize: 11 },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h3,
    marginBottom: Spacing[1],
  },
  desc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.body - 2, // 14pt fits standard screens beautifully
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing[3],
  },
  duration: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    marginTop: 'auto', // Pushes to the absolute bottom of the flex card
  },
  diffDots: { flexDirection: 'row', gap: 4 },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  locked: { opacity: 0.5 },

  // Tooltip
  tooltip: {
    position: 'absolute',
    top: 36,
    right: Spacing[4],
    backgroundColor: Colors.brandPrimary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    zIndex: 999,
  },
  tooltipText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.textInverse,
    textTransform: 'lowercase',
  },
  tooltipArrow: {
    position: 'absolute',
    top: -6,
    right: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: Colors.brandPrimary,
  },
});
