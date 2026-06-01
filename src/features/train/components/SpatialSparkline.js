// src/features/train/components/SpatialSparkline.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Typography, Spacing, Radius } from '../../../theme';

export default function SpatialSparkline({ history = [], Colors }) {
  // Take last 7 sessions in chronological order (oldest to newest)
  const dataSessions = [...history]
    .filter(s => !s.abandoned)
    .slice(0, 7)
    .reverse();

  const scores = dataSessions.map(s => s.spatialEfficiency ?? 0);
  const totalPoints = scores.length;

  // Render dummy placeholders if not enough sessions
  const hasData = totalPoints >= 2;
  const chartScores = hasData ? scores : [45, 60, 55, 75, 70, 85];
  const chartLength = chartScores.length;

  // Svg layout bounds
  const width = 300;
  const height = 100;
  const paddingX = 20;
  const paddingY = 15;

  const minVal = 0;
  const maxVal = 100;

  const getCoords = (index, val) => {
    const x = paddingX + (index / (chartLength - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
    return { x, y };
  };

  // Build path
  let pathD = '';
  let fillPathD = '';

  if (chartLength > 1) {
    const start = getCoords(0, chartScores[0]);
    pathD = `M ${start.x} ${start.y}`;
    
    // Connected lines or curve approximation
    for (let i = 1; i < chartLength; i++) {
      const p = getCoords(i, chartScores[i]);
      pathD += ` L ${p.x} ${p.y}`;
    }

    // Fill path goes to bottom
    const lastPoint = getCoords(chartLength - 1, chartScores[chartLength - 1]);
    fillPathD = `${pathD} L ${lastPoint.x} ${height - paddingY} L ${start.x} ${height - paddingY} Z`;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: Colors.textSecondary }]}>spatial efficiency trend</Text>
      
      <View style={styles.chartWrapper}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={Colors.domain.spatial.main} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={Colors.domain.spatial.main} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid Baseline */}
          <Line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#EAEAEA"
            strokeWidth="1"
          />
          <Line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#EAEAEA"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Chart Gradient Fill */}
          {chartLength > 1 && <Path d={fillPathD} fill="url(#gradient)" />}

          {/* Chart Stroke Line */}
          {chartLength > 1 && (
            <Path
              d={pathD}
              fill="none"
              stroke={Colors.domain.spatial.main}
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* Highlight Data Points */}
          {chartScores.map((val, idx) => {
            const p = getCoords(idx, val);
            return (
              <Circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={hasData ? 4 : 3}
                fill={hasData ? Colors.domain.spatial.main : Colors.textMuted}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            );
          })}
        </Svg>

        {!hasData && (
          <View style={styles.overlay}>
            <Text style={[styles.overlayText, { color: Colors.textSecondary }]}>
              Play 2 sessions to unlock trends
            </Text>
          </View>
        )}
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
  title: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: Spacing[2],
  },
  chartWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#FAFAFA',
    borderRadius: Radius.lg,
    padding: Spacing[2],
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250, 250, 250, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  overlayText: {
    fontSize: Typography.size.caption,
    fontFamily: Typography.fontFamily.semiBold,
  },
});
