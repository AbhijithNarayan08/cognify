import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';
import { TouchableScale } from '../motion/Motion';

/**
 * DomainTile — displays score + trend for a single cognitive domain.
 * Problem 6: only renders trend icon when |trend| > 0 — empty slot when no change.
 * @param {{ domain: string, score: number, trend: number, onPress: function }} props
 */
export function DomainTile({ domain, score, trend = 0, onPress }) {
  const Colors = useThemeColors();
  const DOMAINS = getDomains(Colors);
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const domainData = DOMAINS.find(d => d.id === domain);
  if (!domainData) return null;
  const { color, label } = domainData;

  // Problem 6: only show trend indicator when there is actual movement
  const hasTrend = Math.abs(trend) > 0;
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend > 0 ? Colors.positive : Colors.error;

  return (
    <TouchableScale
      style={[styles.tile, { backgroundColor: color.light }, Shadow.sm]}
      onPress={onPress}
    >
      <View style={[styles.dot, { backgroundColor: color.main }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.score}>{score || '—'}</Text>
      {/* Empty slot when no change — cleaner than '—' text indicator */}
      {hasTrend ? (
        <TrendIcon color={trendColor} size={16} />
      ) : (
        <View style={styles.trendSlot} />
      )}
    </TouchableScale>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '30%',
    borderRadius: Radius.card,
    padding: Spacing[4],
    alignItems: 'center',
    gap: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  score: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h3,
    color: Colors.textPrimary,
  },
  // Fixed-height empty slot when trend = 0 — keeps tile height consistent
  trendSlot: { width: 16, height: 16 },
});
