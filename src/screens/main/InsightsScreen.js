import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Line, Text as SvgText, Circle, G, Rect } from 'react-native-svg';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';
import { t } from '../../constants/useStrings';
import { INSIGHT_TEMPLATES } from '../../data/exercises';
import { get14DaysDummyData } from '../../data/dummyData';
import { analytics } from '../../services/analyticsService';
import { isMock } from '../../services/firebase/firebase.config';
import { useApp } from '../../context/AppContext';
import { FadeInUp, TouchableScale } from '../../components/Motion';
import ProjectionGraph from '../../shared/components/ProjectionGraph';
import DomainRadar from '../../shared/components/DomainRadar';
import { SectionHeader } from '../../shared/components/SectionHeader';
import { DynamicBrain } from '../../shared/components/MascotCharacters';
import { InsightCard } from '../../shared/components/InsightCard';
import { useInsights } from '../../features/insights/hooks/useInsights';
import { calculateRegressionSlope, calculatePearson, getLifestyleRating } from '../../shared/utils/analytics';

const { width } = Dimensions.get('window');
const CHART_W = width - Spacing[6] * 4;
const CHART_H = 120;
const PADDING = { left: 8, right: 8, top: 10, bottom: 20 };

// ── Overall Score History Graph (14-day Dynamic with Projections) ───────────────────
function ScoreGraph({ history, Colors, graphStyles, optimizeToggle }) {
  if (!history || history.length < 2) return null;

  const scores = history.map(h => h.score);
  const lastScore = scores[scores.length - 1];
  const N = scores.length;

  // Linear Regression Projection
  const slope = calculateRegressionSlope(history);
  const standardProj = Math.max(300, Math.min(1000, Math.round(lastScore + 7 * slope)));
  const optimizedProj = Math.max(300, Math.min(1000, Math.round(lastScore + 7 * (slope + 0.82))));

  // Bounds including the 7 days out projections
  const allValues = [...scores, standardProj, optimizedProj];
  const minS = Math.min(...allValues) - 20;
  const maxS = Math.max(...allValues) + 20;

  // X-axis distributed from 0 to N - 1 + 7 (which is N + 6 days total)
  const toX = (i) => PADDING.left + (i / (N + 6)) * (CHART_W - PADDING.left - PADDING.right);
  const toY = (s) => PADDING.top + ((maxS - s) / (maxS - minS)) * (CHART_H - PADDING.top - PADDING.bottom);

  const points = scores.map((s, i) => `${toX(i)},${toY(s)}`).join(' ');

  const areaPoints = [
    `${toX(0)},${CHART_H - PADDING.bottom}`,
    ...scores.map((s, i) => `${toX(i)},${toY(s)}`),
    `${toX(N - 1)},${CHART_H - PADDING.bottom}`,
  ].join(' ');

  const last7 = scores.slice(-7);
  const avg7 = Math.round(last7.reduce((a, b) => a + b, 0) / last7.length);
  const avgY = toY(avg7);

  const todayX = toX(N - 1);
  const todayY = toY(lastScore);

  const futureX = toX(N + 5); // 7 days in future
  const standardY = toY(standardProj);
  const optimizedY = toY(optimizedProj);

  // Self-heal/fallback styles locally to guarantee zero crashes if graphStyles is undefined
  const activeGraphStyles = useMemo(() => {
    if (graphStyles && typeof graphStyles === 'object') {
      return graphStyles;
    }
    return StyleSheet.create({
      container: { marginBottom: Spacing[2] },
      xLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing[1] },
      xLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted },
    });
  }, [graphStyles, Colors]);

  return (
    <View style={activeGraphStyles.container}>
      <Svg width={CHART_W} height={CHART_H}>
        {/* Past Area */}
        <Polyline
          points={areaPoints}
          fill={Colors.brandPrimary}
          fillOpacity={0.08}
          stroke="none"
        />
        
        {/* 7-Day Reference Line */}
        <Line
          x1={PADDING.left} y1={avgY}
          x2={CHART_W - PADDING.right} y2={avgY}
          stroke={Colors.border}
          strokeWidth={1}
          strokeDasharray="4,3"
        />
        <SvgText
          x={CHART_W - PADDING.right}
          y={avgY - 3}
          fontSize={9}
          fill={Colors.textMuted}
          textAnchor="end"
          fontFamily={Typography.fontFamily.regular}
        >
          avg {avg7}
        </SvgText>

        {/* Past Line */}
        <Polyline
          points={points}
          fill="none"
          stroke={Colors.brandPrimary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Today Marker */}
        <Circle
          cx={todayX}
          cy={todayY}
          r={5.5}
          fill={Colors.coral}
          stroke={Colors.surface}
          strokeWidth={2}
        />

        {/* 7-Day Projection Dashed Line */}
        {optimizeToggle ? (
          <G>
            {/* Optimized path line */}
            <Line
              x1={todayX}
              y1={todayY}
              x2={futureX}
              y2={optimizedY}
              stroke="#FFB300"
              strokeWidth={2.2}
              strokeDasharray="4,3"
              strokeLinecap="round"
            />
            {/* Double layer halo */}
            <Circle cx={futureX} cy={optimizedY} r={8} fill="#FFB300" opacity={0.3} />
            <Circle cx={futureX} cy={optimizedY} r={4.5} fill="#E65100" stroke={Colors.surface} strokeWidth={1.5} />
            <SvgText
              x={futureX}
              y={optimizedY - 8}
              fontSize={10}
              fontFamily={Typography.fontFamily.bold}
              fill="#E65100"
              textAnchor="middle"
            >
              {optimizedProj}
            </SvgText>
          </G>
        ) : (
          <G>
            {/* Standard path line */}
            <Line
              x1={todayX}
              y1={todayY}
              x2={futureX}
              y2={standardY}
              stroke={Colors.textMuted}
              strokeWidth={2}
              strokeDasharray="4,3"
              strokeLinecap="round"
            />
            <Circle cx={futureX} cy={standardY} r={4.5} fill={Colors.textMuted} stroke={Colors.surface} strokeWidth={1.5} />
            <SvgText
              x={futureX}
              y={standardY - 8}
              fontSize={9}
              fontFamily={Typography.fontFamily.bold}
              fill={Colors.textMuted}
              textAnchor="middle"
            >
              {standardProj}
            </SvgText>
          </G>
        )}
      </Svg>
      <View style={activeGraphStyles.xLabels}>
        <Text style={activeGraphStyles.xLabel}>{history.length > 14 ? t('insights.time.30d') : t('insights.time.14d')}</Text>
        <Text style={activeGraphStyles.xLabel}>{t('insights.time.today')}</Text>
        <Text style={[activeGraphStyles.xLabel, { color: optimizeToggle ? '#E65100' : Colors.textMuted, fontFamily: Typography.fontFamily.bold }]}>+7d proj</Text>
      </View>
    </View>
  );
}

// ── Dedicated Parameter Trend Graph (14-day Dynamic) ────────────────────
function ParameterTrendGraph({ history, parameter, color, Colors }) {
  if (!history || history.length < 2) return null;

  const scores = history.map(h => h.domains?.[parameter] || h.score || 0);
  const minS = Math.min(...scores) - 15;
  const maxS = Math.max(...scores) + 15;

  const toX = (i) => PADDING.left + (i / (scores.length - 1)) * (CHART_W - PADDING.left - PADDING.right);
  const toY = (s) => PADDING.top + ((maxS - s) / (maxS - minS)) * (CHART_H - PADDING.top - PADDING.bottom);

  const points = scores.map((s, i) => `${toX(i)},${toY(s)}`).join(' ');

  const areaPoints = [
    `${toX(0)},${CHART_H - PADDING.bottom}`,
    ...scores.map((s, i) => `${toX(i)},${toY(s)}`),
    `${toX(scores.length - 1)},${CHART_H - PADDING.bottom}`,
  ].join(' ');

  const last7 = scores.slice(-7);
  const avg7 = Math.round(last7.reduce((a, b) => a + b, 0) / last7.length);
  const avgY = toY(avg7);

  return (
    <View style={{ marginTop: Spacing[2] }}>
      <Svg width={CHART_W} height={CHART_H}>
        <Polyline
          points={areaPoints}
          fill={color}
          fillOpacity={0.06}
          stroke="none"
        />
        <Line
          x1={PADDING.left} y1={avgY}
          x2={CHART_W - PADDING.right} y2={avgY}
          stroke={Colors.border}
          strokeWidth={1}
          strokeDasharray="4,3"
        />
        <SvgText
          x={CHART_W - PADDING.right}
          y={avgY - 3}
          fontSize={9}
          fill={Colors.textMuted}
          textAnchor="end"
          fontFamily={Typography.fontFamily.medium}
        >
          avg: {avg7}
        </SvgText>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle
          cx={toX(scores.length - 1)}
          cy={toY(scores[scores.length - 1])}
          r={5}
          fill={color}
          stroke={Colors.surface}
          strokeWidth={2}
        />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing[1], marginTop: 6 }}>
        <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted }}>{history.length > 14 ? t('insights.time.30d') : t('insights.time.14d')}</Text>
        <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted }}>{t('insights.time.7d')}</Text>
        <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted }}>{t('insights.time.today')}</Text>
      </View>
    </View>
  );
}

// ── Parameter Trends Card ────────────────────────────────────────────────
function DomainTrendsCard({ history, Colors, DOMAINS, styles }) {
  const [selectedParam, setSelectedParam] = useState('memory');

  const domain = DOMAINS.find(d => d.id === selectedParam);
  const strokeColor = domain ? domain.color.main : Colors.brandPrimary;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('insights.parameterTrends')}</Text>
      <Text style={styles.cardSub}>{t('insights.parameterTrendsSub')}</Text>

      {/* Domain Button Segment row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.paramSelectorRow}
      >
        {DOMAINS.map(d => (
          <TouchableOpacity
            key={d.id}
            style={[
              styles.paramTab,
              selectedParam === d.id && { backgroundColor: d.color.main }
            ]}
            onPress={() => setSelectedParam(d.id)}
          >
            <Text
              style={[
                styles.paramTabText,
                selectedParam === d.id && { color: Colors.textInverse }
              ]}
            >
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* dedicated param line graph */}
      <ParameterTrendGraph
        history={history}
        parameter={selectedParam}
        color={strokeColor}
        Colors={Colors}
      />
    </View>
  );
}

// ── Multi-Parameter Timeline Progression & Contribution Card ─────────────
function MultiParameterTimelineCard({ history, Colors, DOMAINS, styles }) {
  const [activeDomains, setActiveDomains] = useState({
    memory: true,
    speed: false,
    attention: true,
    executive: false,
    verbal: false,
    spatial: false,
  });

  const toggleDomain = (id) => {
    setActiveDomains(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Scale Y bounds dynamically based on active lines
  const activeKeys = Object.keys(activeDomains).filter(k => activeDomains[k]);
  let allScores = [];
  history.forEach(h => {
    activeKeys.forEach(k => {
      allScores.push(h.domains?.[k] || h.score || 700);
    });
  });
  if (allScores.length === 0) allScores = [600, 800];

  const minS = Math.min(...allScores) - 12;
  const maxS = Math.max(...allScores) + 12;

  const timelineHeight = 160;
  const paddingX = 16;
  const paddingY = 12;

  const toX = (i) => paddingX + (i / (history.length - 1)) * (CHART_W - paddingX * 2);
  const toY = (s) => paddingY + ((maxS - s) / (maxS - minS)) * (timelineHeight - paddingY * 2);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('insights.parameterContribution')}</Text>
      <Text style={styles.cardSub}>{t('insights.parameterContributionSub')}</Text>

      {/* Multi-Line Timeline Svg */}
      <View style={{ height: timelineHeight, marginTop: Spacing[2], marginBottom: Spacing[4] }}>
        <Svg width={CHART_W} height={timelineHeight}>
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, index) => {
            const yVal = minS + r * (maxS - minS);
            const yPos = toY(yVal);
            return (
              <G key={index}>
                <Line
                  x1={paddingX}
                  y1={yPos}
                  x2={CHART_W - paddingX}
                  y2={yPos}
                  stroke={Colors.border}
                  strokeWidth={0.5}
                  strokeDasharray="3,3"
                />
                <SvgText
                  x={paddingX + 2}
                  y={yPos - 3}
                  fontSize={8}
                  fill={Colors.textMuted}
                  fontFamily={Typography.fontFamily.medium}
                >
                  {Math.round(yVal)}
                </SvgText>
              </G>
            );
          })}

          {/* Plotting active curves */}
          {DOMAINS.map(d => {
            if (!activeDomains[d.id]) return null;

            const domainScores = history.map(h => h.domains?.[d.id] || h.score || 700);
            const points = domainScores.map((s, i) => `${toX(i)},${toY(s)}`).join(' ');

            return (
              <G key={d.id}>
                <Polyline
                  points={points}
                  fill="none"
                  stroke={d.color.main}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <Circle
                  cx={toX(domainScores.length - 1)}
                  cy={toY(domainScores[domainScores.length - 1])}
                  r={4.5}
                  fill={d.color.main}
                  stroke={Colors.surface}
                  strokeWidth={1.5}
                />
              </G>
            );
          })}
        </Svg>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: paddingX, marginTop: 4 }}>
          <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 9, color: Colors.textMuted }}>{history.length > 14 ? t('insights.time.30d') : t('insights.time.14d')}</Text>
          <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 9, color: Colors.textMuted }}>{t('insights.time.7d')}</Text>
          <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 9, color: Colors.textMuted }}>{t('insights.time.today')}</Text>
        </View>
      </View>

      {/* Domain Contribution Lists */}
      <View style={styles.contributionStack}>
        {DOMAINS.map(d => {
          const currentScore = history[history.length - 1]?.domains?.[d.id] || history[history.length - 1]?.score || 700;
          const contribution = Math.round(currentScore / 6);
          const isActive = activeDomains[d.id];

          return (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.contributionItem,
                isActive ? { backgroundColor: d.color.light, borderColor: d.color.main } : { borderColor: Colors.border }
              ]}
              onPress={() => toggleDomain(d.id)}
              activeOpacity={0.8}
            >
              <View style={styles.contributionLeft}>
                <View style={[styles.contributionDot, { backgroundColor: d.color.main }]} />
                <Text style={[styles.contributionName, { color: Colors.textPrimary }]} numberOfLines={1}>{d.label}</Text>
              </View>
              <View style={styles.contributionRight}>
                <Text style={styles.contributionValue}>{t('insights.scoreLabel', { score: currentScore })}</Text>
                <Text style={[styles.contributionPoints, { color: d.color.main }]}>{t('insights.contributionPoints', { contribution })}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Compact SVG Sparkline for Grid (7-day Dynamic) ──────────────────────
function WeeklySparkline({ history, parameter, color, Colors, width: w = 120 }) {
  if (!history || history.length < 7) return null;

  const scores = history.slice(-7).map(h => h.domains?.[parameter] || h.score || 700);
  const minS = Math.min(...scores) - 10;
  const maxS = Math.max(...scores) + 10;

  const h = 40;
  const paddingY = 4;

  const toX = (i) => (i / 6) * w;
  const toY = (s) => paddingY + ((maxS - s) / (maxS - minS)) * (h - paddingY * 2);

  const points = scores.map((s, i) => `${toX(i)},${toY(s)}`).join(' ');
  const areaPoints = [
    `0,${h}`,
    ...scores.map((s, i) => `${toX(i)},${toY(s)}`),
    `${w},${h}`
  ].join(' ');

  return (
    <View style={{ marginTop: Spacing[2], height: h }}>
      <Svg width={w} height={h}>
        <Polyline
          points={areaPoints}
          fill={color}
          fillOpacity={0.06}
          stroke="none"
        />
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle
          cx={toX(6)}
          cy={toY(scores[6])}
          r={3}
          fill={color}
          stroke={Colors.surface}
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}

// ── SVG 7-Day Mini Bar Chart (Zone 1) ─────────────────────────────────────────
function WeeklyBriefBarChart({ week2Data, Colors }) {
  const chartHeight = 85;
  const barWidth = 16;
  const spacing = (CHART_W - 40 - 7 * barWidth) / 6;

  return (
    <View style={{ alignItems: 'center', marginVertical: Spacing[4] }}>
      <Svg width={CHART_W} height={chartHeight}>
        {/* Draw a subtle horizontal baseline */}
        <Line
          x1={10}
          y1={60}
          x2={CHART_W - 10}
          y2={60}
          stroke={Colors.border}
          strokeWidth={1}
          opacity={0.5}
        />

        {(week2Data || []).map((day, i) => {
          if (!day) return null;
          const isTrained = day.trained;
          const score = day.score || 500;
          const x = 20 + i * (barWidth + spacing);
          
          // Height mapping
          const minH = 10;
          const maxH = 50;
          const barH = isTrained ? minH + ((score - 400) / 600) * (maxH - minH) : minH;
          const y = 60 - barH;
          const barColor = isTrained ? Colors.brandPrimary : Colors.surfaceAlt;
          const strokeColor = isTrained ? 'transparent' : Colors.border;

          return (
            <G key={`bar-${day.date || ''}-${i}`}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={barColor}
                stroke={strokeColor}
                strokeWidth={isTrained ? 0 : 1}
              />
              <SvgText
                x={x + barWidth / 2}
                y={75}
                fontSize={10}
                fontFamily={Typography.fontFamily.bold}
                fill={isTrained ? Colors.textPrimary : Colors.textMuted}
                textAnchor="middle"
              >
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ── SVG 6-Domain Horizontal Bar Chart (Zone 2) ───────────────────────────────
function DomainBreakdownBarChart({ domainScores, Colors, DOMAINS }) {
  const chartHeight = 168;
  const maxScore = Math.max(...Object.values(domainScores));
  const barMaxWidth = CHART_W - 85;

  return (
    <View style={{ marginVertical: Spacing[3], paddingHorizontal: Spacing[1] }}>
      <Svg width={CHART_W} height={chartHeight}>
        {DOMAINS.map((d, i) => {
          const score = domainScores[d.id] || 500;
          const y = i * 26 + 4;
          const barWidth = Math.max(12, ((score - 300) / (maxScore - 300)) * barMaxWidth);
          const abbreviation = {
            memory: 'MEM',
            speed: 'SPD',
            attention: 'ATT',
            executive: 'EXC',
            verbal: 'VRB',
            spatial: 'SPA',
          }[d.id] || 'DOM';

          return (
            <G key={d.id}>
              {/* Domain label */}
              <SvgText
                x={0}
                y={y + 9}
                fontSize={11}
                fontFamily={Typography.fontFamily.bold}
                fill={d.color.main}
                textAnchor="start"
              >
                {abbreviation}
              </SvgText>

              {/* Muted background track */}
              <Rect
                x={40}
                y={y}
                width={barMaxWidth}
                height={10}
                rx={5}
                fill={Colors.surfaceAlt}
                stroke={Colors.border}
                strokeWidth={0.5}
                opacity={0.8}
              />

              {/* Domain filled bar */}
              <Rect
                x={40}
                y={y}
                width={barWidth}
                height={10}
                rx={5}
                fill={d.color.main}
              />

              {/* Domain score (safe-inset by 8px to prevent clipping) */}
              <SvgText
                x={CHART_W - 8}
                y={y + 9}
                fontSize={11}
                fontFamily={Typography.fontFamily.bold}
                fill={Colors.textPrimary}
                textAnchor="end"
              >
                {score}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
function SleepCorrelationChart({ avgHighSleep, avgLowSleep, Colors }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginVertical: Spacing[3] }}>
      {/* Left Box: 7.5+ hrs sleep */}
      <View style={{
        flex: 1,
        backgroundColor: Colors.surfaceAlt,
        borderColor: Colors.border,
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingVertical: Spacing[4],
        paddingHorizontal: Spacing[2],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          fontSize: 22,
          fontFamily: Typography.fontFamily.extraBold,
          color: Colors.positive,
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {avgHighSleep}
        </Text>
        <Text style={{
          fontSize: 11,
          fontFamily: Typography.fontFamily.bold,
          color: Colors.textSecondary,
          textAlign: 'center',
        }}>
          {t('insights.sleep.high')}
        </Text>
      </View>

      {/* Right Box: under 7.5 hrs sleep */}
      <View style={{
        flex: 1,
        backgroundColor: Colors.surfaceAlt,
        borderColor: Colors.border,
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingVertical: Spacing[4],
        paddingHorizontal: Spacing[2],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          fontSize: 22,
          fontFamily: Typography.fontFamily.extraBold,
          color: Colors.textPrimary,
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {avgLowSleep}
        </Text>
        <Text style={{
          fontSize: 11,
          fontFamily: Typography.fontFamily.bold,
          color: Colors.textSecondary,
          textAlign: 'center',
        }}>
          {t('insights.sleep.low')}
        </Text>
      </View>
    </View>
  );
}

// ── Parameter Performance Sparkline Grid ─────────────────────────────────
function ParameterBriefGrid({ history, Colors, DOMAINS, styles }) {
  const cardWidth = (width - Spacing[6] * 2 - 12) / 2;

  return (
    <View style={styles.gridContainer}>
      <Text style={styles.gridSectionHeader}>{t('insights.allParameters7Day')}</Text>
      <View style={styles.briefGrid}>
        {DOMAINS.map(d => {
          const currentScore = history[history.length - 1]?.domains?.[d.id] || history[history.length - 1]?.score || 700;
          const week1Scores = history.slice(-14, -7).map(h => h.domains?.[d.id] || h.score || 700);
          const week2Scores = history.slice(-7).map(h => h.domains?.[d.id] || h.score || 700);
          const avgWeek1 = week1Scores.reduce((a, b) => a + b, 0) / 7;
          const avgWeek2 = week2Scores.reduce((a, b) => a + b, 0) / 7;
          const delta = Math.round(avgWeek2 - avgWeek1);

          return (
            <View
              key={d.id}
              style={[styles.briefGridCard, { width: cardWidth }, Shadow.sm]}
            >
              <View style={styles.briefGridHeader}>
                <View style={[styles.briefGridDot, { backgroundColor: d.color.main }]} />
                <Text style={styles.briefGridName}>{d.label}</Text>
              </View>
              <View style={styles.briefGridScoreRow}>
                <Text style={[styles.briefGridScore, { color: d.color.main }]}>{currentScore}</Text>
                <Text style={[
                  styles.briefGridDelta,
                  { color: delta >= 0 ? Colors.positive : Colors.coral }
                ]}>
                  {delta >= 0 ? `+${delta}` : delta}
                </Text>
              </View>
              <WeeklySparkline
                history={history}
                parameter={d.id}
                color={d.color.main}
                Colors={Colors}
                width={cardWidth - Spacing[4] * 2}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Interactive Habit-Cognitive Correlation Playground (TASK 4) ───────────────────────
function CorrelationPlayground({ history, correlations, calibrationComplete, Colors, DOMAINS, styles }) {
  const [selectedHabit, setSelectedHabit] = useState('sleep');
  const [selectedDomain, setSelectedDomain] = useState('memory');

  const habitOptions = [
    { id: 'sleep', labelKey: 'insights.habit.sleep' },
    { id: 'mood', labelKey: 'insights.habit.mood' },
    { id: 'activity', labelKey: 'insights.habit.activity' },
  ];

  const domainObj = DOMAINS.find(d => d.id === selectedDomain) || DOMAINS[0];
  const domainLabel = domainObj.label;
  const habitLabel = t(`insights.habit.${selectedHabit}`);

  // Resolve Pearson correlation coefficient
  const r = correlations[selectedHabit]?.[selectedDomain] || 0;

  // Resolve correlation strength tier & plain-language translations
  let tierLabel = t('insights.playground.tier.resilient');
  let tierColor = '#8E8A86'; // neutral grey
  let tierDescription = t('insights.playground.desc.resilient');
  let headline = t('insights.playground.headline.resilient', { domain: domainLabel, habit: habitLabel });
  let coachMessage = t('insights.playground.coach.resilient', { domain: domainLabel, habit: habitLabel });

  if (r >= 0.6) {
    tierLabel = t('insights.playground.tier.strongPositive');
    tierColor = Colors.positive || '#3DC27A';
    tierDescription = t('insights.playground.desc.superpower');
    headline = t('insights.playground.headline.strongPositive', { domain: domainLabel, habit: habitLabel });
    coachMessage = t('insights.playground.coach.strongPositive', { domain: domainLabel, habit: habitLabel });
  } else if (r >= 0.3) {
    tierLabel = t('insights.playground.tier.moderatePositive');
    tierColor = '#FF9900';
    tierDescription = t('insights.playground.desc.booster');
    headline = t('insights.playground.headline.moderatePositive', { domain: domainLabel, habit: habitLabel });
    coachMessage = t('insights.playground.coach.moderatePositive', { domain: domainLabel, habit: habitLabel });
  } else if (r <= -0.6) {
    tierLabel = t('insights.playground.tier.strongNegative');
    tierColor = Colors.coral || '#FF7DB4';
    tierDescription = t('insights.playground.desc.disruptor');
    headline = t('insights.playground.headline.strongNegative', { domain: domainLabel, habit: habitLabel });
    coachMessage = t('insights.playground.coach.strongNegative', { domain: domainLabel, habit: habitLabel });
  } else if (r <= -0.3) {
    tierLabel = t('insights.playground.tier.moderateNegative');
    tierColor = '#D84315';
    tierDescription = t('insights.playground.desc.disruptor');
    headline = t('insights.playground.headline.moderateNegative', { domain: domainLabel, habit: habitLabel });
    coachMessage = t('insights.playground.coach.moderateNegative', { domain: domainLabel, habit: habitLabel });
  }

  // Extraction of data arrays
  const X = history.map(h => getLifestyleRating(selectedHabit, h[selectedHabit]));
  const Y = history.map(h => h.domains?.[selectedDomain] || h.score || 700);

  const timelineHeight = 135;
  const paddingX = 16;
  const paddingY = 12;

  const minX = Math.min(...X);
  const maxX = Math.max(...X);
  const minY = Math.min(...Y) - 10;
  const maxY = Math.max(...Y) + 10;

  const toX = (i) => paddingX + (i / (history.length - 1)) * (CHART_W - paddingX * 2);
  const toY_X = (val) => paddingY + ((maxX - val) / (maxX - minX || 1)) * (timelineHeight - paddingY * 2);
  const toY_Y = (val) => paddingY + ((maxY - val) / (maxY - minY || 1)) * (timelineHeight - paddingY * 2);

  const pointsX = X.map((v, i) => `${toX(i)},${toY_X(v)}`).join(' ');
  const pointsY = Y.map((v, i) => `${toX(i)},${toY_Y(v)}`).join(' ');

  return (
    <View style={styles.playgroundContainer}>
      {/* Selector Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('insights.habitExplorer.title')}</Text>
        <Text style={styles.cardSub}>{t('insights.habitExplorer.sub')}</Text>

        {/* Habit Selector */}
        <Text style={styles.playgroundSectionLabel}>{t('insights.habitExplorer.chooseHabit')}</Text>
        <View style={styles.playgroundPillRow}>
          {habitOptions.map(h => (
            <TouchableOpacity
              key={h.id}
              style={[
                styles.paramTab,
                selectedHabit === h.id && { backgroundColor: '#FFD56B' }
              ]}
              onPress={() => setSelectedHabit(h.id)}
            >
              <Text
                style={[
                  styles.paramTabText,
                  selectedHabit === h.id && { color: '#E65100', fontFamily: Typography.fontFamily.bold }
                ]}
              >
                {t(h.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cognitive Domain Selector */}
        <Text style={styles.playgroundSectionLabel}>{t('insights.habitExplorer.chooseDomain')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.paramSelectorRow}
        >
          {DOMAINS.map(d => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.paramTab,
                selectedDomain === d.id && { backgroundColor: d.color.main }
              ]}
              onPress={() => setSelectedDomain(d.id)}
            >
              <Text
                style={[
                  styles.paramTabText,
                  selectedDomain === d.id && { color: Colors.textInverse }
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dynamic Correlation Graph Card */}
      <View style={[styles.card, Shadow.md]}>
        <View style={styles.playgroundMeterHeader}>
          <View style={[styles.correlationBadge, { backgroundColor: tierColor + '15', borderColor: tierColor }]}>
            <Text style={[styles.correlationBadgeText, { color: tierColor }]}>
              {r >= 0 ? '+' : ''}{r.toFixed(2)} {tierLabel}
            </Text>
          </View>
          <Text style={styles.correlationTitle}>{headline}</Text>
          <Text style={styles.correlationSubtitle}>{tierDescription}</Text>
        </View>

        {/* Paired SVG Timeline Graph */}
        <View style={{ height: timelineHeight, marginVertical: Spacing[4] }}>
          <Svg width={CHART_W} height={timelineHeight}>
            {/* Reference Grid lines */}
            {[0, 0.5, 1].map((ratio, index) => {
              const yPos = paddingY + ratio * (timelineHeight - paddingY * 2);
              return (
                <Line
                  key={index}
                  x1={paddingX}
                  y1={yPos}
                  x2={CHART_W - paddingX}
                  y2={yPos}
                  stroke={Colors.border}
                  strokeWidth={0.5}
                  strokeDasharray="3,3"
                />
              );
            })}

            {/* Lifestyle Line (Gold) */}
            <Polyline
              points={pointsX}
              fill="none"
              stroke="#FFB300"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle
              cx={toX(X.length - 1)}
              cy={toY_X(X[X.length - 1])}
              r={4}
              fill="#FFB300"
              stroke={Colors.surface}
              strokeWidth={1}
            />

            {/* Cognitive Line (Domain color) */}
            <Polyline
              points={pointsY}
              fill="none"
              stroke={domainObj.color.main}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle
              cx={toX(Y.length - 1)}
              cy={toY_Y(Y[Y.length - 1])}
              r={4}
              fill={domainObj.color.main}
              stroke={Colors.surface}
              strokeWidth={1}
            />
          </Svg>
          
          {/* Timeline X-labels */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: paddingX, marginTop: 4 }}>
            <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 9, color: Colors.textMuted }}>{t('insights.time.30d')}</Text>
            <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 9, color: Colors.textMuted }}>{t('insights.time.today')}</Text>
          </View>
        </View>

        {/* Graph Legend */}
        <View style={styles.playgroundLegend}>
          <View style={styles.playgroundLegendItem}>
            <View style={[styles.playgroundDot, { backgroundColor: domainObj.color.main }]} />
            <Text style={styles.playgroundLegendText}>{t('insights.playground.legend.domainScore', { domain: domainObj.label })}</Text>
          </View>
          <View style={styles.playgroundLegendItem}>
            <View style={[styles.playgroundDot, { backgroundColor: '#FFB300' }]} />
            <Text style={styles.playgroundLegendText}>{t('insights.playground.legend.habitRating', { habit: t(habitOptions.find(h => h.id === selectedHabit).labelKey) })}</Text>
          </View>
        </View>
      </View>

      {/* Dynamic Cream Coach's Analysis Card */}
      <View style={styles.coachCard}>
        <Text style={styles.coachCardTitle}>{t('insights.coachAnalysis')}</Text>
        <Text style={styles.coachCardBody}>{coachMessage}</Text>
      </View>
    </View>
  );
}

const getGraphStyles = (Colors) => StyleSheet.create({
  container: { marginBottom: Spacing[2] },
  xLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing[1] },
  xLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted },
});

export default function InsightsScreen({ navigation, route }) {
  const { state, dispatch } = useApp();
  const insets = useSafeAreaInsets();

  const { initialTab } = route?.params ?? {};
  const [activeTab, setActiveTab] = useState(initialTab ?? 'overview');

  useEffect(() => {
    analytics.track('screen_viewed', { screenName: 'Insights' });
  }, []);

  React.useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
      navigation.setParams({ initialTab: null });
    }
  }, [route?.params?.initialTab]);

  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const graphStyles = useMemo(() => getGraphStyles(Colors), [Colors]);
  const DOMAINS = getDomains(Colors);

  const [optimizeToggle, setOptimizeToggle] = useState(false);

  const {
    cognitiveScore,
    domainScores,
    scoreHistory: activeScoreHistory,
    cohortPercentile,
    weeklyBrief,
    last7Avg,
    correlations,
    projections,
    calibrationComplete,
  } = useInsights();

  const activeDomainScores = useMemo(() => {
    if (domainScores && Object.keys(domainScores).length > 0) {
      return domainScores;
    }
    const finalScore = cognitiveScore || 742;
    return {
      memory: Math.round(finalScore + 15),
      speed: Math.round(finalScore - 30),
      attention: Math.round(finalScore + 35),
      executive: Math.round(finalScore - 15),
      verbal: Math.round(finalScore + 25),
      spatial: Math.round(finalScore - 25),
    };
  }, [domainScores, cognitiveScore]);

  // Self-heal scoreHistory if empty, using old schema, or missing new fields (only in local mock mode)
  React.useEffect(() => {
    if (!isMock) return; // Skip self-heal entirely for real Firebase users to allow empty histories!

    const needsRefresh = !state.scoreHistory
      || state.scoreHistory.length === 0
      || !state.scoreHistory[0]?.domains
      || state.scoreHistory[0]?.mood === undefined;  // Force refresh for new data format

    if (needsRefresh) {
      const baseScore = cognitiveScore || 715;
      dispatch({
        type: 'COMPLETE_ONBOARDING',
        payload: { cognitiveScore: baseScore }
      });
    }
  }, [state.scoreHistory, cognitiveScore]);

  // ── Dynamic calculations from 14-day history dummy data ─────────────────
  const weeklyInsights = useMemo(() => {
    // 1. Safe fallbacks if activeScoreHistory is empty or onboarding is incomplete
    if (!activeScoreHistory || activeScoreHistory.length === 0) {
      const defaultDomain = DOMAINS[0];
      return {
        isBaseline: true,
        avgScore: cognitiveScore || 700,
        deltaText: t('insights.deltaText.baseline'),
        dateRangeStr: t('insights.dateRange.current'),
        trainedDaysCount: 0,
        week2Data: [],
        mostImproved: { domain: defaultDomain, imp: 0 },
        needsAttention: { domain: defaultDomain, imp: 0 },
        hasEnoughSleepLogs: false,
        avgHighSleep: 700,
        avgLowSleep: 700,
      };
    }

    const isBaseline = activeScoreHistory.length < 14;

    // 2. Week 2 (indices 7-13 or last 7 days) and Week 1 (indices 0-6 or preceding 7 days)
    const week2Data = activeScoreHistory.slice(-7).filter(Boolean);
    const week1Data = isBaseline ? [] : activeScoreHistory.slice(-14, -7).filter(Boolean);

    // Week Averages
    const week2Scores = week2Data.map(h => h.score);
    const avgScore = Math.round(week2Scores.reduce((a, b) => a + b, 0) / week2Scores.length);
    
    let deltaText = '';
    let deltaVal = 0;
    if (isBaseline) {
      deltaText = t('insights.baselineWeek');
    } else {
      const week1Scores = week1Data.map(h => h.score);
      const avgWeek1 = Math.round(week1Scores.reduce((a, b) => a + b, 0) / week1Scores.length);
      deltaVal = avgScore - avgWeek1;
      deltaText = deltaVal >= 0 
        ? t('insights.deltaText.positive', { delta: deltaVal }) 
        : t('insights.deltaText.negative', { delta: deltaVal });
    }

    // Week Range formatting
    const formatDate = (dateStr) => {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const startDate = week2Data[0]?.date || new Date().toISOString().split('T')[0];
    const endDate = week2Data[week2Data.length - 1]?.date || new Date().toISOString().split('T')[0];
    const dateRangeStr = `${formatDate(startDate)} – ${formatDate(endDate)}`;

    // Trained days count
    const trainedDaysCount = week2Data.filter(h => h.trained).length;

    // 3. Domain improvement calculations
    const domainImprovement = {};
    DOMAINS.forEach(d => {
      const w2Scores = week2Data.map(h => h.domains?.[d.id] || activeScoreHistory[activeScoreHistory.length - 1]?.domains?.[d.id] || 500);
      const avg2 = w2Scores.reduce((a, b) => a + b, 0) / w2Scores.length;
      
      let avg1 = avg2;
      if (!isBaseline) {
        const w1Scores = week1Data.map(h => h.domains?.[d.id] || 500);
        avg1 = w1Scores.reduce((a, b) => a + b, 0) / w1Scores.length;
      }
      
      domainImprovement[d.id] = Math.round(avg2 - avg1);
    });

    const sortedImps = [...DOMAINS].map(d => ({
      domain: d,
      imp: domainImprovement[d.id] || 0
    })).sort((a, b) => b.imp - a.imp);

    const mostImproved = sortedImps[0] || { domain: DOMAINS[0], imp: 0 };
    const needsAttention = sortedImps[sortedImps.length - 1] || { domain: DOMAINS[1], imp: 0 };

    // 4. Sleep correlation calculations
    const sleepLogs = week2Data.filter(h => h.sleep !== null && h.sleep !== undefined && h.sleep > 0);
    const hasEnoughSleepLogs = sleepLogs.length >= 3;

    const highSleepDays = week2Data.filter(h => h.sleep >= 7.5);
    const lowSleepDays = week2Data.filter(h => h.sleep < 7.5);

    const avgHighSleep = highSleepDays.length > 0
      ? Math.round(highSleepDays.reduce((sum, h) => sum + h.score, 0) / highSleepDays.length)
      : 742;
    const avgLowSleep = lowSleepDays.length > 0
      ? Math.round(lowSleepDays.reduce((sum, h) => sum + h.score, 0) / lowSleepDays.length)
      : 651;

    return {
      isBaseline,
      avgScore,
      deltaVal,
      deltaText,
      dateRangeStr,
      trainedDaysCount,
      week2Data,
      mostImproved,
      needsAttention,
      hasEnoughSleepLogs,
      avgHighSleep,
      avgLowSleep,
    };
  }, [activeScoreHistory, DOMAINS, cognitiveScore]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('insights.title')}</Text>
        <View style={styles.tabRow}>
          {['overview', 'weekly brief', 'playground'].map(tab => {
            const isTabActive = activeTab === (tab === 'weekly brief' ? 'brief' : tab);
            let tabLabel = t('insights.overview');
            if (tab === 'weekly brief') tabLabel = t('home.weeklyBrief');
            if (tab === 'playground') tabLabel = t('insights.playground');

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isTabActive && styles.tabActive]}
                onPress={() => setActiveTab(tab === 'weekly brief' ? 'brief' : tab)}
              >
                <Text style={[styles.tabText, isTabActive && styles.tabTextActive]}>
                  {tabLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <>
            {/* Score history */}
            <FadeInUp delay={0} style={[styles.card, Shadow.md]}>
              <View style={styles.scoreHeaderRow}>
                <View>
                  <Text style={styles.scoreNum}>{cognitiveScore || 742}</Text>
                  <Text style={styles.scoreLabel}>{t('insights.currentScore')}</Text>
                </View>
                <View style={styles.percentileBadge}>
                  <Text style={styles.percentileText}>{t('insights.topPercentile', { percentile: 100 - (cohortPercentile || 78) })}</Text>
                </View>
              </View>
              <ScoreGraph
                history={activeScoreHistory}
                Colors={Colors}
                graphStyles={graphStyles}
                optimizeToggle={optimizeToggle}
              />
              
              {/* Premium Optimize Habits Toggle */}
              <View style={styles.optimizeRow}>
                <View style={styles.optimizeTextContainer}>
                  <Text style={styles.optimizeTitle}>Optimize My Habits</Text>
                  <Text style={styles.optimizeDesc}>Show trajectory with 7+ hrs sleep & daily sessions</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.optimizeToggleBg,
                    optimizeToggle ? { backgroundColor: '#FFD56B' } : { backgroundColor: Colors.border }
                  ]}
                  onPress={() => setOptimizeToggle(!optimizeToggle)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optimizeToggleThumb,
                      optimizeToggle
                        ? { alignSelf: 'flex-end', backgroundColor: '#E65100' }
                        : { alignSelf: 'flex-start', backgroundColor: '#FFFFFF' }
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </FadeInUp>

            {/* Cognitive Parameter Trend Graphs (Dedicated graph for each domain!) */}
            {activeScoreHistory && activeScoreHistory.length > 0 && (
              <FadeInUp delay={75}>
                <DomainTrendsCard history={activeScoreHistory} Colors={Colors} DOMAINS={DOMAINS} styles={styles} />
              </FadeInUp>
            )}

            {/* Multi-Parameter Progression Timeline Card */}
            {activeScoreHistory && activeScoreHistory.length > 0 && (
              <FadeInUp delay={120}>
                <MultiParameterTimelineCard history={activeScoreHistory} Colors={Colors} DOMAINS={DOMAINS} styles={styles} />
              </FadeInUp>
            )}

            {/* Cognitive Projection Graph Card */}
            <FadeInUp delay={180} style={[styles.card, Shadow.md]}>
              <Text style={styles.cardTitle}>{t('insights.projection30Day')}</Text>
              <Text style={styles.cardSub}>{t('insights.projection30DaySub')}</Text>
              <View style={{ marginTop: Spacing[2] }}>
                <ProjectionGraph cognitiveScore={cognitiveScore || 680} containerWidth={CHART_W} />
              </View>
            </FadeInUp>

            {/* Domain Radar */}
            {activeDomainScores && (
              <FadeInUp delay={240} style={[styles.card, Shadow.md]}>
                <Text style={styles.cardTitle}>{t('insights.cognitiveProfile')}</Text>
                <Text style={styles.cardSub}>{t('insights.cognitiveProfileSub')}</Text>
                
                <Text style={{
                  fontFamily: Typography.fontFamily.semiBold,
                  fontSize: Typography.size.caption,
                  color: Colors.textMuted,
                  textAlign: 'center',
                  marginTop: Spacing[4],
                }}>
                  {t('insights.sixCognitiveDomains')}
                </Text>
                
                <DomainRadar scores={activeDomainScores} size={220} />

                {/* Legend directly below radar (Q15) */}
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: Spacing[3],
                  marginVertical: Spacing[4],
                  paddingHorizontal: Spacing[2],
                }}>
                  {DOMAINS.map(domain => (
                    <View key={domain.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: domain.color.main }} />
                      <Text style={{
                        fontFamily: Typography.fontFamily.medium,
                        fontSize: 11,
                        color: Colors.textSecondary,
                      }}>
                        {domain.label} · {activeDomainScores[domain.id]}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Domain list */}
                <View style={styles.domainList}>
                  {DOMAINS.map(d => (
                    <View key={d.id} style={styles.domainListRow}>
                      <View style={[styles.domainDot, { backgroundColor: d.color.main }]} />
                      <Text style={styles.domainListName}>{d.label}</Text>
                      <View style={styles.domainListBar}>
                        <View style={[
                          styles.domainListFill,
                          { width: `${((activeDomainScores[d.id] - 400) / 600) * 100}%`, backgroundColor: d.color.main },
                        ]} />
                      </View>
                      <Text style={[styles.domainListScore, { color: d.color.main }]}>
                        {activeDomainScores[d.id]}
                      </Text>
                    </View>
                  ))}
                </View>
              </FadeInUp>
            )}

            {/* Lifestyle Correlations */}
            <FadeInUp delay={300}>
              <SectionHeader title={t('insights.linkedScores')} />
              {INSIGHT_TEMPLATES.map(t => (
                <InsightCard
                  key={t.id}
                  headline={t.headline}
                  body={t.body}
                  accent={t.accent}
                  bg={t.bg}
                />
              ))}
            </FadeInUp>

            {/* Quarterly report teaser */}
            <FadeInUp delay={380}>
              <TouchableScale style={[styles.reportCard, Shadow.sm]}>
                <Text style={styles.reportLabel}>{t('insights.quarterlyReport')}</Text>
                <Text style={styles.reportTitle}>{t('insights.quarterlyReportSub')}</Text>
                <Text style={styles.reportNote}>{t('insights.quarterlyReportNote')}</Text>
                <View style={styles.reportBadge}>
                  <Text style={styles.reportBadgeText}>{t('insights.comingSoon')}</Text>
                </View>
              </TouchableScale>
            </FadeInUp>
          </>
        )}

        {activeTab === 'brief' && (
          // Weekly Brief Redesign
          <View style={styles.briefContainer}>
            <View style={styles.briefHeaderRow}>
              <View style={styles.briefHeaderLeft}>
                <Text style={styles.briefDate}>
                  {weeklyInsights.dateRangeStr}
                </Text>
                <Text style={styles.briefHeadline}>{t('insights.weekInReview')}</Text>
              </View>
              <DynamicBrain size={160} />
            </View>

            {/* ZONE 1: Summary & Training Consistency Chart */}
            <FadeInUp delay={0} style={[styles.card, Shadow.md]}>
              <View style={styles.scoreHeaderRow}>
                <View>
                  <Text style={styles.scoreNum}>{weeklyInsights.avgScore}</Text>
                  <Text style={styles.scoreLabel}>{t('insights.weekScoreAverage')}</Text>
                </View>
                <View style={[
                  styles.percentileBadge,
                  { backgroundColor: weeklyInsights.isBaseline ? Colors.surfaceAlt : (weeklyInsights.deltaVal >= 0 ? Colors.positiveBg : Colors.coralLight) }
                ]}>
                  <Text style={[
                    styles.percentileText,
                    { color: weeklyInsights.isBaseline ? Colors.textSecondary : (weeklyInsights.deltaVal >= 0 ? Colors.positive : Colors.coral) }
                  ]}>
                    {weeklyInsights.isBaseline ? t('insights.baseline') : (weeklyInsights.deltaVal >= 0 ? `+${weeklyInsights.deltaVal}` : `${weeklyInsights.deltaVal}`)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardSub, { marginTop: 4 }]}>
                {weeklyInsights.deltaText}
              </Text>
              
              <WeeklyBriefBarChart
                week2Data={weeklyInsights.week2Data}
                Colors={Colors}
              />
            </FadeInUp>

            {/* ZONE 2: Domain Breakdown */}
            <FadeInUp delay={100} style={[styles.card, Shadow.md]}>
              <Text style={styles.cardTitle}>{t('insights.domainBreakdown')}</Text>
              <Text style={styles.cardSub}>{t('insights.domainBreakdownSub')}</Text>
              
              {weeklyInsights.trainedDaysCount >= 3 ? (
                <>
                  <DomainBreakdownBarChart
                    domainScores={activeDomainScores}
                    Colors={Colors}
                    DOMAINS={DOMAINS}
                  />

                  {/* Callouts (stacked vertically to prevent text overflow) */}
                  <View style={styles.calloutStack}>
                    {/* Most Improved Callout Card */}
                    <View style={[styles.calloutCard, { backgroundColor: Colors.positiveBg, borderColor: Colors.positive }]}>
                      <TrendingUp size={20} color={Colors.positive} style={{ marginTop: 2 }} />
                      <View style={styles.calloutTextContainer}>
                        <Text style={[styles.calloutLabel, { color: Colors.positive }]}>{t('insights.mostImproved')}</Text>
                        <Text style={[styles.calloutValue, { color: Colors.textPrimary }]}>
                          {weeklyInsights.mostImproved.domain.label} ({t('insights.contributionPoints', { contribution: weeklyInsights.mostImproved.imp })})
                        </Text>
                      </View>
                    </View>
                    
                    {/* Needs Attention Callout Card */}
                    <View style={[styles.calloutCard, { backgroundColor: Colors.coralLight, borderColor: Colors.coral }]}>
                      <TrendingDown size={20} color={Colors.coral} style={{ marginTop: 2 }} />
                      <View style={styles.calloutTextContainer}>
                        <Text style={[styles.calloutLabel, { color: Colors.coral }]}>{t('insights.needsAttention')}</Text>
                        <Text style={[styles.calloutValue, { color: Colors.textPrimary }]}>
                          {weeklyInsights.needsAttention.domain.label} ({weeklyInsights.needsAttention.imp < 0 ? t('insights.contributionPoints', { contribution: weeklyInsights.needsAttention.imp }) : t('insights.notTrained')})
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.nudgeContainer}>
                  <Text style={styles.nudgeText}>{t('insights.train3TimesBreakdown')}</Text>
                </View>
              )}
            </FadeInUp>

            {/* ZONE 3: Lifestyle Correlation Panel */}
            <FadeInUp delay={200} style={[styles.card, Shadow.md]}>
              <Text style={styles.cardTitle}>{t('insights.lifestyleCorrelation')}</Text>
              
              {weeklyInsights.hasEnoughSleepLogs ? (
                <>
                  <Text style={styles.cardSub}>{t('insights.lifestyleCorrelationSub')}</Text>
                  <SleepCorrelationChart
                    avgHighSleep={weeklyInsights.avgHighSleep}
                    avgLowSleep={weeklyInsights.avgLowSleep}
                    Colors={Colors}
                  />
                  <Text style={[styles.cardSub, { textAlign: 'center', marginTop: 10, fontFamily: Typography.fontFamily.semiBold }]}>
                    {t('insights.sleepPerformanceDriver')}
                  </Text>
                </>
              ) : (
                <View style={styles.nudgeContainer}>
                  <Text style={styles.nudgeTitle}>{t('insights.logSleepCheckinsTitle')}</Text>
                  <Text style={styles.nudgeText}>{t('insights.logSleepCheckinsSubtitle')}</Text>
                </View>
              )}
            </FadeInUp>

            {/* ZONE 4: Actionable Focus Card */}
            <FadeInUp delay={300} style={[styles.focusCard, Shadow.md]}>
              <View style={styles.focusHeader}>
                <Text style={styles.focusLabel}>{t('insights.thisWeeksFocus')}</Text>
                <Text style={[styles.focusDomainName, { color: weeklyInsights.needsAttention.domain.color.main }]}>
                  {weeklyInsights.needsAttention.domain.label}
                </Text>
              </View>
              
              <Text style={styles.focusReason}>
                {weeklyInsights.needsAttention.imp < 0 ? (
                  t('insights.focusReasonDipped', { domain: weeklyInsights.needsAttention.domain.label, points: Math.abs(weeklyInsights.needsAttention.imp) })
                ) : (
                  t('insights.focusReasonOpportunity', { domain: weeklyInsights.needsAttention.domain.label })
                )}
              </Text>

              <TouchableScale
                style={[styles.focusCTA, { backgroundColor: weeklyInsights.needsAttention.domain.color.main }]}
                onPress={() => navigation.navigate('Train', { initialFilter: weeklyInsights.needsAttention.domain.id })}
              >
                <Text style={styles.focusCTAText}>
                  {t('insights.startDomainSession', { domain: weeklyInsights.needsAttention.domain.label })}
                </Text>
                <ArrowRight size={18} color={Colors.textInverse} style={{ marginLeft: 6 }} />
              </TouchableScale>
            </FadeInUp>
          </View>
        )}

        {activeTab === 'playground' && (
          <CorrelationPlayground
            history={activeScoreHistory}
            correlations={correlations}
            calibrationComplete={calibrationComplete}
            Colors={Colors}
            DOMAINS={DOMAINS}
            styles={styles}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[3] },
  title: {
    fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.size.h1,
    color: Colors.textPrimary, marginBottom: Spacing[4],
  },
  tabRow: { flexDirection: 'row', gap: Spacing[2] },
  tab: {
    borderRadius: Radius.full, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
    backgroundColor: Colors.surfaceAlt,
  },
  tabActive: { backgroundColor: Colors.brandPrimary },
  tabText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.caption, color: Colors.textSecondary },
  tabTextActive: { color: Colors.textInverse },
  content: { paddingHorizontal: Spacing[6] },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing[6], marginBottom: Spacing[5],
  },
  scoreHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[4] },
  scoreNum: { fontFamily: Typography.fontFamily.extraBold, fontSize: 48, color: Colors.textPrimary, lineHeight: 54 },
  scoreLabel: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption, color: Colors.textMuted },
  percentileBadge: { backgroundColor: Colors.brandLight, borderRadius: Radius.sm, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  percentileText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.caption, color: Colors.brandPrimary },
  cardTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.h3, color: Colors.textPrimary, marginBottom: Spacing[1] },
  cardSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption, color: Colors.textMuted, marginBottom: Spacing[4] },
  domainList: { marginTop: Spacing[4], gap: Spacing[3] },
  domainListRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  domainDot: { width: 8, height: 8, borderRadius: 4 },
  domainListName: { width: 60, fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.caption, color: Colors.textSecondary },
  domainListBar: { flex: 1, height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  domainListFill: { height: 5, borderRadius: 3 },
  domainListScore: { width: 36, fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.caption, textAlign: 'right' },
  reportCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing[6], marginBottom: Spacing[4],
  },
  reportLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.caption, color: Colors.textMuted, marginBottom: 2 },
  reportTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.h3, color: Colors.textPrimary },
  reportNote: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption, color: Colors.textMuted, marginTop: Spacing[1] },
  reportBadge: { marginTop: Spacing[3], backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: 3, alignSelf: 'flex-start' },
  reportBadgeText: { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: Colors.textMuted },
  
  // Segment Selector
  paramSelectorRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginVertical: Spacing[3],
    paddingRight: Spacing[4],
  },
  paramTab: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  paramTabText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Contribution list
  contributionStack: {
    gap: Spacing[2],
  },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  contributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  contributionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contributionName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    flexShrink: 1,
  },
  contributionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  contributionValue: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  contributionPoints: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
  },

  // Redesigned Brief Styles
  briefContainer: { paddingBottom: Spacing[6] },
  briefDate: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.body, color: Colors.brandPrimary, marginTop: Spacing[2] },
  briefHeadline: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.size.h1, color: Colors.textPrimary, marginBottom: 0 },
  briefHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  briefHeaderLeft: {
    flex: 1,
  },
  calloutStack: {
    marginTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing[4],
    gap: Spacing[3],
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 10,
  },
  calloutTextContainer: {
    flex: 1,
  },
  calloutLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
  },
  calloutValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    marginTop: 2,
  },
  nudgeContainer: {
    padding: Spacing[4],
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing[2],
  },
  nudgeTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  nudgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  focusCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.xl,
    padding: Spacing[6],
    marginBottom: Spacing[4],
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing[2],
  },
  focusLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
  },
  focusDomainName: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h3,
  },
  focusReason: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing[5],
  },
  focusCTA: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCTAText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: Colors.textInverse,
  },

  // Sparkline Grid
  gridContainer: {
    marginTop: Spacing[6],
    marginBottom: Spacing[4],
  },
  gridSectionHeader: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
    paddingHorizontal: Spacing[1],
  },
  briefGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  briefGridCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: 4,
  },
  briefGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  briefGridDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  briefGridName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  briefGridScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  briefGridScore: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 20,
  },
  briefGridDelta: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
  },

  /* Premium Optimize Habits Toggle */
  optimizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginTop: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optimizeTextContainer: {
    flex: 1,
    marginRight: Spacing[3],
  },
  optimizeTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body - 1,
    color: Colors.textPrimary,
  },
  optimizeDesc: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  optimizeToggleBg: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  optimizeToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    ...Shadow.sm,
  },

  /* Correlation Playground Styles */
  playgroundContainer: {
    width: '100%',
  },
  playgroundSectionLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  playgroundPillRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginVertical: Spacing[1],
  },
  playgroundMeterHeader: {
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing[2],
  },
  correlationBadge: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: 6,
    marginBottom: 4,
  },
  correlationBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
  },
  correlationTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  correlationSubtitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  playgroundLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[6],
    marginTop: Spacing[2],
  },
  playgroundLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playgroundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playgroundLegendText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  coachCard: {
    backgroundColor: '#FAF7F0',
    borderRadius: Radius.xl,
    padding: Spacing[6],
    marginBottom: Spacing[6],
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: Spacing[2],
    ...Shadow.sm,
  },
  coachCardTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: '#7C786E',
  },
  coachCardBody: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: '#4C4942',
    lineHeight: 20,
  },
});
