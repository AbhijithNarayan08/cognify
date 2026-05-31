import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useThemeColors, Typography, getDomains } from '../theme';

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_RADIUS = 80;
const GUIDE_RADII = [MAX_RADIUS * 0.33, MAX_RADIUS * 0.66, MAX_RADIUS];

function polarToCartesian(cx, cy, radius, angleIndex, total = 6) {
  const angle = (2 * Math.PI * angleIndex) / total - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function scoreToRadius(score) {
  return Math.max(6, (score / 1000) * MAX_RADIUS);
}

function pointsString(scores, DOMAINS) {
  return DOMAINS.map((_, i) => {
    const r = scoreToRadius(scores[DOMAINS[i].id] || 0);
    const pt = polarToCartesian(CX, CY, r, i);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

function baselinePoints(DOMAINS) {
  return DOMAINS.map((_, i) => {
    const pt = polarToCartesian(CX, CY, scoreToRadius(500), i);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

export default function DomainRadar({ scores = {}, showLabels = true, size = SIZE }) {
  const Colors = useThemeColors();
  const DOMAINS = getDomains(Colors);
  const scale = size / SIZE;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Guide circles */}
        {GUIDE_RADII.map((r, i) => (
          <Polygon
            key={i}
            points={DOMAINS.map((_, di) => {
              const pt = polarToCartesian(CX, CY, r, di);
              return `${pt.x},${pt.y}`;
            }).join(' ')}
            fill="none"
            stroke={Colors.border}
            strokeWidth={0.8}
            strokeOpacity={0.6}
          />
        ))}

        {/* Axis lines */}
        {DOMAINS.map((_, i) => {
          const outer = polarToCartesian(CX, CY, MAX_RADIUS, i);
          return (
            <Line
              key={i}
              x1={CX}
              y1={CY}
              x2={outer.x}
              y2={outer.y}
              stroke={Colors.border}
              strokeWidth={0.8}
              strokeOpacity={0.5}
            />
          );
        })}

        {/* Baseline polygon */}
        <Polygon
          points={baselinePoints(DOMAINS)}
          fill="none"
          stroke={Colors.border}
          strokeWidth={1.5}
          strokeDasharray="4,3"
          strokeOpacity={0.6}
        />

        {/* Score polygon */}
        <Polygon
          points={pointsString(scores, DOMAINS)}
          fill={Colors.brandPrimary}
          fillOpacity={0.18}
          stroke={Colors.brandPrimary}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Domain dots */}
        {DOMAINS.map((domain, i) => {
          const r = scoreToRadius(scores[domain.id] || 0);
          const pt = polarToCartesian(CX, CY, r, i);
          return (
            <Circle
              key={domain.id}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={domain.color.main}
              stroke={Colors.surface}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Labels */}
        {showLabels && DOMAINS.map((domain, i) => {
          const labelR = MAX_RADIUS + 16;
          const pt = polarToCartesian(CX, CY, labelR, i);
          const textAnchor =
            pt.x < CX - 4 ? 'end' :
            pt.x > CX + 4 ? 'start' : 'middle';
          return (
            <SvgText
              key={domain.id}
              x={pt.x}
              y={pt.y + 4}
              textAnchor={textAnchor}
              fontSize={10}
              fontFamily={Typography.fontFamily.medium}
              fill={domain.color.main}
            >
              {domain.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
