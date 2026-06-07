// src/features/train/components/MirrorTrapTrendLine.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Typography, Spacing, Radius } from '../../../theme';
import { t } from '../../../constants/useStrings';

export default function MirrorTrapTrendLine({ history = [], Colors }) {
  // Take last 7 sessions in chronological order
  const dataSessions = [...history]
    .filter(s => !s.abandoned)
    .slice(0, 7)
    .reverse();

  // Extract mirror trap error rate (proportion of errors that were mirror traps)
  const mirrorRates = dataSessions.map(s => {
    if (!s.foilBreakdown) return 0;
    return s.foilBreakdown.mirror ?? 0;
  });

  const totalPoints = mirrorRates.length;

  const hasData = totalPoints >= 2;
  const chartRates = hasData ? mirrorRates : [0.70, 0.55, 0.40, 0.45, 0.30, 0.20];
  const chartLength = chartRates.length;

  // SVG parameters
  const width = 300;
  const height = 90;
  const paddingX = 20;
  const paddingY = 15;

  const minVal = 0;
  const maxVal = 1.0;

  const getCoords = (index, val) => {
    const x = paddingX + (index / (chartLength - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (val / maxVal) * (height - 2 * paddingY);
    return { x, y };
  };

  let pathD = '';
  let fillPathD = '';

  if (chartLength > 1) {
    const start = getCoords(0, chartRates[0]);
    pathD = `M ${start.x} ${start.y}`;

    for (let i = 1; i < chartLength; i++) {
      const p = getCoords(i, chartRates[i]);
      pathD += ` L ${p.x} ${p.y}`;
    }

    const lastPoint = getCoords(chartLength - 1, chartRates[chartLength - 1]);
    fillPathD = `${pathD} L ${lastPoint.x} ${height - paddingY} L ${start.x} ${height - paddingY} Z`;
  }

  // Visual trend color: green if downward trend, otherwise orange/coral
  const startVal = chartRates[0];
  const endVal = chartRates[chartLength - 1];
  const isDownward = endVal < startVal;
  const strokeColor = isDownward ? '#3DC27A' : '#F4A041';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.textSecondary }]}>{t('patternFold.mirrorTrend.title')}</Text>
        {hasData && (
          <Text style={[styles.trendLabel, { color: strokeColor }]}>
            {isDownward ? t('patternFold.mirrorTrend.down') : t('patternFold.mirrorTrend.stable')}
          </Text>
        )}
      </View>

      <View style={styles.chartWrapper}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="mirrorGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Guidelines */}
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

          {/* Area Fill */}
          {chartLength > 1 && <Path d={fillPathD} fill="url(#mirrorGradient)" />}

          {/* Trend Line */}
          {chartLength > 1 && (
            <Path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Data Nodes */}
          {chartRates.map((val, idx) => {
            const p = getCoords(idx, val);
            return (
              <Circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={hasData ? 3.5 : 2.5}
                fill={hasData ? strokeColor : Colors.textMuted}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          })}
        </Svg>

        {!hasData && (
          <View style={styles.overlay}>
            <Text style={[styles.overlayText, { color: Colors.textSecondary }]}>
              {t('patternFold.mirrorTrend.overlay')}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  title: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  trendLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
