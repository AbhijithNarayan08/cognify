import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated, Easing
} from 'react-native';
import Svg, {
  Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient as SvgLinearGradient, Stop
} from 'react-native-svg';
import { useThemeColors, Typography, Spacing, Radius } from '../../theme';
import { t } from '../../constants/useStrings';

const { width } = Dimensions.get('window');

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);

const SunNode = ({ cx, cy, Colors }) => (
  <G>
    {/* Outer Glow */}
    <Circle cx={cx} cy={cy} r={12} fill="#FFB300" opacity={0.25} />
    {/* Sun Core */}
    <Circle cx={cx} cy={cy} r={6} fill="#FF9900" />
    {/* Rays */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = cx + 8 * Math.cos(rad);
      const y1 = cy + 8 * Math.sin(rad);
      const x2 = cx + 11 * Math.cos(rad);
      const y2 = cy + 11 * Math.sin(rad);
      return (
        <Line
          key={angle}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#FF9900"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      );
    })}
  </G>
);

export default function ProjectionGraph({ cognitiveScore = 680, containerWidth }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const [displayScore, setDisplayScore] = useState(cognitiveScore);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Responsive width calculations
  const svgWidth = containerWidth || Math.min(width - Spacing[6] * 2, 340);
  const svgHeight = 220;

  const originX = 40;
  const originY = 175;

  const startX = 50;
  const endX = svgWidth - 30;
  
  // Distribute days along the timeline visually
  const day7X = startX + (endX - startX) * 0.28;
  const day14X = startX + (endX - startX) * 0.55;
  const day30X = endX;

  useEffect(() => {
    // Reset and start graph drawing animation
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Animate score counter from cognitiveScore to cognitiveScore + 155 in real-time
    const duration = 1800;
    const steps = 40;
    const interval = duration / steps;
    const increment = 155 / steps;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      if (stepCount >= steps) {
        setDisplayScore(cognitiveScore + 155);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(cognitiveScore + increment * stepCount));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [cognitiveScore]);

  // Interpolations for milestone appearances (100% crash-proof opacities passed as attributes)
  const opacityDay7 = progressAnim.interpolate({
    inputRange: [0, 0.28, 0.38],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const opacityDay14 = progressAnim.interpolate({
    inputRange: [0, 0.55, 0.65],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const opacityDay30 = progressAnim.interpolate({
    inputRange: [0, 0.88, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // Calculate paths for drawing
  const growthCurvePath = `M ${startX},130 Q ${(startX + endX) / 2},120 ${endX},60`;
  const declineCurvePath = `M ${startX},130 Q ${(startX + endX) / 2},135 ${endX},152`;
  const growthAreaPath = `M ${startX},130 Q ${(startX + endX) / 2},120 ${endX},60 L ${endX},${originY} L ${startX},${originY} Z`;

  // We estimate the length of the growth curve is about endX - startX + 50 (approx 300px)
  const pathLength = 320;

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [pathLength, 0],
    extrapolate: 'clamp',
  });

  const fillOpacity = progressAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Live Score Counter Badge */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreMetric}>
          <Text style={styles.scoreLabel}>{t('insights.currentScore')}</Text>
          <Text style={styles.scoreNumber}>{cognitiveScore}</Text>
        </View>

        <Text style={styles.arrowIcon}>→</Text>

        <View style={styles.scoreMetric}>
          <Text style={[styles.scoreLabel, { color: Colors.brandPrimary }]}>{t('onboarding.projection.projectedScore')}</Text>
          <Text style={[styles.scoreNumber, { color: Colors.brandPrimary }]}>{displayScore}</Text>
        </View>

        <View style={styles.growthBadge}>
          <Text style={styles.growthText}>+22.8%</Text>
        </View>
      </View>

      <Svg width={svgWidth} height={svgHeight}>
        <Defs>
          <SvgLinearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.positive} stopOpacity="0.25" />
            <Stop offset="1" stopColor={Colors.positive} stopOpacity="0.0" />
          </SvgLinearGradient>
        </Defs>

        {/* Milestone Vertical Grid Lines (Animated using standard opacity prop) */}
        <AnimatedLine x1={day7X} y1={124} x2={day7X} y2={originY} stroke={Colors.border} strokeWidth={1} strokeDasharray="3,3" opacity={opacityDay7} />
        <AnimatedLine x1={day14X} y1={110} x2={day14X} y2={originY} stroke={Colors.border} strokeWidth={1} strokeDasharray="3,3" opacity={opacityDay14} />
        <AnimatedLine x1={day30X} y1={60} x2={day30X} y2={originY} stroke={Colors.border} strokeWidth={1} strokeDasharray="3,3" opacity={opacityDay30} />

        {/* Axes */}
        {/* Y Axis */}
        <Line x1={originX} y1={originY} x2={originX} y2={20} stroke={Colors.textSecondary} strokeWidth={1.5} />
        <Path d="M 37,25 L 40,19 L 43,25 Z" fill={Colors.textSecondary} />
        <SvgText
          x={48}
          y={28}
          fill={Colors.textSecondary}
          fontSize={11}
          fontFamily={Typography.fontFamily.medium}
        >
          {t('onboarding.projection.yAxisLabel')}
        </SvgText>

        {/* X Axis */}
        <Line x1={originX} y1={originY} x2={svgWidth - 10} y2={originY} stroke={Colors.textSecondary} strokeWidth={1.5} />
        <Path d={`M ${svgWidth - 14},172 L ${svgWidth - 8},175 L ${svgWidth - 14},178`} fill={Colors.textSecondary} />
        <SvgText
          x={svgWidth - 56}
          y={196}
          fill={Colors.textMuted}
          fontSize={11}
          fontFamily={Typography.fontFamily.medium}
        >
          {t('onboarding.projection.xAxisLabel')}
        </SvgText>

        {/* Path B: WITHOUT Cognify (Grey decline curve) */}
        <AnimatedPath
          d={declineCurvePath}
          fill="none"
          stroke={Colors.textMuted}
          strokeWidth={2}
          strokeDasharray="4,4"
          opacity={progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.65],
          })}
        />
        <AnimatedG opacity={opacityDay30}>
          {/* Day 30 label for decline path */}
          <SvgText
            x={day30X}
            y={170}
            textAnchor="middle"
            fill={Colors.textMuted}
            fontSize={10}
            fontFamily={Typography.fontFamily.bold}
          >
            {cognitiveScore - 25}
          </SvgText>
        </AnimatedG>

        {/* Path A: WITH Cognify (Green growth curve with gradient fill) */}
        {/* Animated Gradient Fill */}
        <AnimatedPath
          d={growthAreaPath}
          fill="url(#growthGrad)"
          opacity={fillOpacity}
        />

        {/* Animated Growth Curve */}
        <AnimatedPath
          d={growthCurvePath}
          fill="none"
          stroke={Colors.positive}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${pathLength} ${pathLength}`}
          strokeDashoffset={strokeDashoffset}
        />

        {/* Milestones above timeline (appear in sequence as line draws) */}
        {/* Day 7 Milestones */}
        <AnimatedG opacity={opacityDay7}>
          <Circle cx={day7X} cy={124} r={5} fill={Colors.appBg} stroke={Colors.positive} strokeWidth={2.5} />
          <SvgText
            x={day7X}
            y={108}
            textAnchor="middle"
            fill={Colors.textPrimary}
            fontSize={11}
            fontFamily={Typography.fontFamily.bold}
          >
            {t('onboarding.projection.7days')}
          </SvgText>
          <SvgText
            x={day7X}
            y={140}
            textAnchor="middle"
            fill={Colors.positive}
            fontSize={10}
            fontFamily={Typography.fontFamily.medium}
          >
            +{Math.round(cognitiveScore * 0.05)}
          </SvgText>
        </AnimatedG>

        {/* Day 14 Milestones */}
        <AnimatedG opacity={opacityDay14}>
          <Circle cx={day14X} cy={110} r={5} fill={Colors.appBg} stroke={Colors.positive} strokeWidth={2.5} />
          <SvgText
            x={day14X}
            y={94}
            textAnchor="middle"
            fill={Colors.textPrimary}
            fontSize={11}
            fontFamily={Typography.fontFamily.bold}
          >
            {t('onboarding.projection.14days')}
          </SvgText>
          <SvgText
            x={day14X}
            y={126}
            textAnchor="middle"
            fill={Colors.positive}
            fontSize={10}
            fontFamily={Typography.fontFamily.medium}
          >
            +{Math.round(cognitiveScore * 0.11)}
          </SvgText>
        </AnimatedG>

        {/* Day 30 Milestone (Sun) */}
        <AnimatedG opacity={opacityDay30}>
          <SunNode cx={day30X} cy={60} Colors={Colors} />
          <SvgText
            x={day30X}
            y={38}
            textAnchor="middle"
            fill={Colors.brandPrimary}
            fontSize={11}
            fontFamily={Typography.fontFamily.bold}
          >
            {t('onboarding.projection.30days')}
          </SvgText>
          <SvgText
            x={day30X}
            y={82}
            textAnchor="middle"
            fill={Colors.brandPrimary}
            fontSize={10}
            fontFamily={Typography.fontFamily.bold}
          >
            {cognitiveScore + 155}
          </SvgText>
        </AnimatedG>
      </Svg>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.positive }]} />
          <Text style={styles.legendText}>{t('onboarding.projection.withApp', { score: cognitiveScore + 155 })}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} />
          <Text style={styles.legendText}>{t('onboarding.projection.withoutApp', { score: cognitiveScore - 25 })}</Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing[2],
    marginBottom: Spacing[4],
  },
  scoreMetric: {
    flexDirection: 'column',
  },
  scoreLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
  },
  scoreNumber: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 32,
    color: Colors.textPrimary,
    lineHeight: 38,
  },
  arrowIcon: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 24,
    color: Colors.textMuted,
    alignSelf: 'center',
    marginTop: 8,
  },
  growthBadge: {
    backgroundColor: Colors.positiveBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  growthText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    color: Colors.positive,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing[6],
    marginTop: Spacing[5],
    justifyContent: 'center',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
  },
});
