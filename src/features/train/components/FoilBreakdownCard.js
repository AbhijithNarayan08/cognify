// src/features/train/components/FoilBreakdownCard.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, Radius, Shadow } from '../../../theme';

export default function FoilBreakdownCard({ foilBreakdown, Colors }) {
  const mirrorProgress = useRef(new Animated.Value(0)).current;
  const angleProgress = useRef(new Animated.Value(0)).current;
  const chiralityProgress = useRef(new Animated.Value(0)).current;

  const mirrorPct = foilBreakdown ? Math.round(foilBreakdown.mirror * 100) : 0;
  const anglePct = foilBreakdown ? Math.round(foilBreakdown.angle * 100) : 0;
  const chiralityPct = foilBreakdown ? Math.round(foilBreakdown.chirality * 100) : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mirrorProgress, {
        toValue: mirrorPct,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(angleProgress, {
        toValue: anglePct,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(chiralityProgress, {
        toValue: chiralityPct,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, [mirrorPct, anglePct, chiralityPct]);

  const totalErrors = mirrorPct + anglePct + chiralityPct;

  return (
    <View style={[styles.card, Shadow.sm, { backgroundColor: Colors.surface }]}>
      <Text style={[styles.cardTitle, { color: Colors.textSecondary }]}>diagnostic error profile</Text>

      {totalErrors === 0 ? (
        <Text style={[styles.emptyText, { color: Colors.textMuted }]}>
          zero errors! Perfect spatial precision achieved this session.
        </Text>
      ) : (
        <View style={styles.rows}>
          {/* Row 1: Mirror Traps */}
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.foilLabel}>mirror traps (chiral flips)</Text>
              <Text style={[styles.foilPct, { color: Colors.domain.spatial.main }]}>{mirrorPct}%</Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    width: mirrorProgress.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: Colors.domain.spatial.main,
                  },
                ]}
              />
            </View>
          </View>

          {/* Row 2: Angle Foils */}
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.foilLabel}>angle foils (incorrect rotation)</Text>
              <Text style={[styles.foilPct, { color: '#0073E6' }]}>{anglePct}%</Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    width: angleProgress.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: '#0073E6',
                  },
                ]}
              />
            </View>
          </View>

          {/* Row 3: Chirality Foils */}
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.foilLabel}>wrong block structures</Text>
              <Text style={[styles.foilPct, { color: '#F4A041' }]}>{chiralityPct}%</Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    width: chiralityProgress.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: '#F4A041',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    width: '100%',
    marginVertical: Spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: Spacing[3],
  },
  rows: {
    gap: Spacing[3],
  },
  row: {
    width: '100%',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[1],
  },
  foilLabel: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.medium,
    color: '#333333',
  },
  foilPct: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.bold,
  },
  barTrack: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  emptyText: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
    paddingVertical: Spacing[2],
  },
});
