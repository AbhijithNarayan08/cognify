// src/features/train/components/AngleRadarChart.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Typography, Spacing, Radius } from '../../../theme';

export default function AngleRadarChart({ history = [], Colors }) {
  // Compute average angle accuracies from history
  const activeSessions = history.filter(s => !s.abandoned);
  const totalSessions = activeSessions.length;

  let avg90 = 0.85; // Default reference profiles if empty
  let avg180 = 0.75;
  let avg270 = 0.60;

  const hasData = totalSessions >= 1;

  if (hasData) {
    let sum90 = 0, count90 = 0;
    let sum180 = 0, count180 = 0;
    let sum270 = 0, count270 = 0;

    activeSessions.forEach(s => {
      if (s.angleAccuracy) {
        if (s.angleAccuracy[90] !== null) {
          sum90 += s.angleAccuracy[90];
          count90++;
        }
        if (s.angleAccuracy[180] !== null) {
          sum180 += s.angleAccuracy[180];
          count180++;
        }
        if (s.angleAccuracy[270] !== null) {
          sum270 += s.angleAccuracy[270];
          count270++;
        }
      }
    });

    avg90 = count90 > 0 ? sum90 / count90 : 0.5;
    avg180 = count180 > 0 ? sum180 / count180 : 0.5;
    avg270 = count270 > 0 ? sum270 / count270 : 0.5;
  }

  // Radar math parameters
  const cx = 100;
  const cy = 95;
  const r = 65;
  
  // Sine and Cosine of 30 degrees (since axis are 0deg, 120deg, 240deg)
  const cos30 = Math.cos(Math.PI / 6); // 0.866
  const sin30 = Math.sin(Math.PI / 6); // 0.500

  // Coords generator
  const getRadarCoords = (v90, v180, v270) => {
    // 90deg axis points straight up
    const x90 = cx;
    const y90 = cy - r * v90;

    // 180deg axis points down-right (120deg vector)
    const x180 = cx + r * cos30 * v180;
    const y180 = cy + r * sin30 * v180;

    // 270deg axis points down-left (240deg vector)
    const x270 = cx - r * cos30 * v270;
    const y270 = cy + r * sin30 * v270;

    return {
      polyStr: `${x90},${y90} ${x180},${y180} ${x270},${y270}`,
      points: [
        { x: x90, y: y90 },
        { x: x180, y: y180 },
        { x: x270, y: y270 }
      ]
    };
  };

  const grid100 = getRadarCoords(1.0, 1.0, 1.0);
  const grid75 = getRadarCoords(0.75, 0.75, 0.75);
  const grid50 = getRadarCoords(0.5, 0.5, 0.5);
  const grid25 = getRadarCoords(0.25, 0.25, 0.25);

  const userSpace = getRadarCoords(avg90, avg180, avg270);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: Colors.textSecondary }]}>spatial asymmetry radar</Text>
      
      <View style={styles.chartWrapper}>
        <Svg width="100%" height={170} viewBox="0 0 200 170">
          {/* Radial Grid lines (Concentric Triangles) */}
          <Polygon points={grid100.polyStr} fill="none" stroke="#EAEAEA" strokeWidth="1" />
          <Polygon points={grid75.polyStr} fill="none" stroke="#EAEAEA" strokeWidth="1" strokeDasharray="2 2" />
          <Polygon points={grid50.polyStr} fill="none" stroke="#EAEAEA" strokeWidth="1" />
          <Polygon points={grid25.polyStr} fill="none" stroke="#EAEAEA" strokeWidth="1" strokeDasharray="2 2" />

          {/* Core Axes Lines */}
          <Line x1={cx} y1={cy} x2={cx} y2={cy - r} stroke="#EAEAEA" strokeWidth="1" />
          <Line x1={cx} y1={cy} x2={cx + r * cos30} y2={cy + r * sin30} stroke="#EAEAEA" strokeWidth="1" />
          <Line x1={cx} y1={cy} x2={cx - r * cos30} y2={cy + r * sin30} stroke="#EAEAEA" strokeWidth="1" />

          {/* User Score Area */}
          <Polygon
            points={userSpace.polyStr}
            fill={hasData ? 'rgba(235, 68, 140, 0.2)' : 'rgba(150, 150, 150, 0.2)'}
            stroke={hasData ? Colors.domain.spatial.main : Colors.textMuted}
            strokeWidth="2.5"
          />

          {/* User Score Vertices */}
          {userSpace.points.map((p, idx) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hasData ? 3.5 : 2.5}
              fill={hasData ? Colors.domain.spatial.main : Colors.textMuted}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          ))}

          {/* Radar Labels */}
          <SvgText
            x={cx}
            y={cy - r - 8}
            fontSize="10"
            fontWeight="bold"
            fill="#555"
            textAnchor="middle"
          >
            90° ({Math.round(avg90 * 100)}%)
          </SvgText>
          <SvgText
            x={cx + r * cos30 + 16}
            y={cy + r * sin30 + 4}
            fontSize="10"
            fontWeight="bold"
            fill="#555"
            textAnchor="start"
          >
            180° ({Math.round(avg180 * 100)}%)
          </SvgText>
          <SvgText
            x={cx - r * cos30 - 16}
            y={cy + r * sin30 + 4}
            fontSize="10"
            fontWeight="bold"
            fill="#555"
            textAnchor="end"
          >
            270° ({Math.round(avg270 * 100)}%)
          </SvgText>
        </Svg>

        {!hasData && (
          <View style={styles.overlay}>
            <Text style={[styles.overlayText, { color: Colors.textSecondary }]}>
              Play 3 sessions to construct radar
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
    alignItems: 'center',
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
