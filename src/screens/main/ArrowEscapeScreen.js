import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { ArrowLeft, RotateCcw, HelpCircle, Heart, Award } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';
import { GameHaptics } from '../../utils/haptics';

// ── Screen and Canvas Dimensions ─────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const CANVAS_SIZE = 320;

// ── Levels Setup ─────────────────────────────────────────────────────────────
const LEVELS = [
  {
    id: 1,
    title: 'level 1',
    description: 'tap the lines to slide them off the board.',
    paths: [
      { id: '1', points: [{x: 60, y: 100}, {x: 260, y: 100}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#4A90E2' },
      { id: '2', points: [{x: 60, y: 160}, {x: 260, y: 160}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#F4A041' },
      { id: '3', points: [{x: 60, y: 220}, {x: 260, y: 220}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#FF5E5B' },
    ]
  },
  {
    id: 2,
    title: 'level 2',
    description: 'lines will block each other. plan your escape sequence!',
    paths: [
      { id: '1', points: [{x: 60, y: 180}, {x: 260, y: 180}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#4A90E2' },
      { id: '2', points: [{x: 160, y: 60}, {x: 160, y: 180}, {x: 100, y: 180}], arrowAt: 'start', dir: {x: 0, y: -1}, color: '#FF5E5B' }
    ]
  },
  {
    id: 3,
    title: 'level 3',
    description: 'clear the blockers first to unlock the paths.',
    paths: [
      { id: '1', points: [{x: 60, y: 130}, {x: 260, y: 130}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#4A90E2' },
      { id: '2', points: [{x: 160, y: 50}, {x: 160, y: 200}, {x: 210, y: 200}], arrowAt: 'start', dir: {x: 0, y: -1}, color: '#FF5E5B' },
      { id: '3', points: [{x: 100, y: 80}, {x: 100, y: 240}], arrowAt: 'end', dir: {x: 0, y: 1}, color: '#F4A041' }
    ]
  },
  {
    id: 4,
    title: 'level 4',
    description: 'nested shapes must be cleared from the outside in.',
    paths: [
      { id: '1', points: [{x: 120, y: 120}, {x: 200, y: 120}, {x: 200, y: 200}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#4A90E2' },
      { id: '2', points: [{x: 90, y: 90}, {x: 230, y: 90}, {x: 230, y: 230}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#FF5E5B' },
      { id: '3', points: [{x: 60, y: 60}, {x: 260, y: 60}, {x: 260, y: 260}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#F4A041' }
    ]
  },
  {
    id: 5,
    title: 'level 5',
    description: 'spirals wind around other paths. untangle them carefully.',
    paths: [
      { id: '1', points: [{x: 160, y: 150}, {x: 160, y: 220}], arrowAt: 'end', dir: {x: 0, y: 1}, color: '#4A90E2' },
      { id: '2', points: [{x: 100, y: 100}, {x: 220, y: 100}, {x: 220, y: 220}, {x: 130, y: 220}, {x: 130, y: 150}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#FF5E5B' }
    ]
  },
  {
    id: 6,
    title: 'level 6',
    description: 'multiple hooks wrapping inside and out.',
    paths: [
      { id: '1', points: [{x: 80, y: 100}, {x: 80, y: 220}], arrowAt: 'start', dir: {x: 0, y: -1}, color: '#4A90E2' },
      { id: '2', points: [{x: 240, y: 100}, {x: 240, y: 220}], arrowAt: 'end', dir: {x: 0, y: 1}, color: '#F4A041' },
      { id: '3', points: [{x: 80, y: 160}, {x: 240, y: 160}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#FF5E5B' },
      { id: '4', points: [{x: 120, y: 120}, {x: 200, y: 120}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#3DAB7F' }
    ]
  },
  {
    id: 7,
    title: 'level 7',
    description: 'a gridlock of horizontal and vertical arrows.',
    paths: [
      { id: '1', points: [{x: 60, y: 90}, {x: 260, y: 90}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#4A90E2' },
      { id: '2', points: [{x: 60, y: 230}, {x: 260, y: 230}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#F4A041' },
      { id: '3', points: [{x: 90, y: 60}, {x: 90, y: 260}], arrowAt: 'end', dir: {x: 0, y: 1}, color: '#FF5E5B' },
      { id: '4', points: [{x: 230, y: 60}, {x: 230, y: 260}], arrowAt: 'start', dir: {x: 0, y: -1}, color: '#3DAB7F' }
    ]
  },
  {
    id: 8,
    title: 'level 8',
    description: 'zig-zag escape shapes. timing and logic are everything.',
    paths: [
      { id: '1', points: [{x: 80, y: 80}, {x: 160, y: 80}, {x: 160, y: 240}, {x: 240, y: 240}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#4A90E2' },
      { id: '2', points: [{x: 80, y: 160}, {x: 240, y: 160}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#FF5E5B' },
      { id: '3', points: [{x: 200, y: 60}, {x: 200, y: 260}], arrowAt: 'end', dir: {x: 0, y: 1}, color: '#F4A041' }
    ]
  },
  {
    id: 9,
    title: 'level 9',
    description: 'interlocking coils trapping a center nucleus.',
    paths: [
      { id: '1', points: [{x: 150, y: 150}, {x: 170, y: 150}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#4A90E2' },
      { id: '2', points: [{x: 100, y: 100}, {x: 220, y: 100}, {x: 220, y: 200}, {x: 100, y: 200}, {x: 100, y: 110}], arrowAt: 'end', dir: {x: 0, y: -1}, color: '#FF5E5B' },
      { id: '3', points: [{x: 80, y: 80}, {x: 240, y: 80}, {x: 240, y: 220}, {x: 80, y: 220}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#F4A041' }
    ]
  },
  {
    id: 10,
    title: 'level 10',
    description: 'the final master maze! slide them out one by one.',
    paths: [
      { id: '1', points: [{x: 40, y: 40}, {x: 280, y: 40}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#4A90E2' },
      { id: '2', points: [{x: 40, y: 80}, {x: 240, y: 80}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#FF5E5B' },
      { id: '3', points: [{x: 80, y: 120}, {x: 280, y: 120}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#F4A041' },
      { id: '4', points: [{x: 40, y: 160}, {x: 200, y: 160}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#3DAB7F' },
      { id: '5', points: [{x: 120, y: 200}, {x: 280, y: 200}], arrowAt: 'end', dir: {x: 1, y: 0}, color: '#A662C6' },
      { id: '6', points: [{x: 40, y: 240}, {x: 240, y: 240}], arrowAt: 'start', dir: {x: -1, y: 0}, color: '#FF7DB4' },
      { id: '7', points: [{x: 80, y: 40}, {x: 80, y: 280}], arrowAt: 'end', dir: {x: 0, y: 1}, color: '#4A90E2' },
      { id: '8', points: [{x: 160, y: 40}, {x: 160, y: 240}], arrowAt: 'start', dir: {x: 0, y: -1}, color: '#FF5E5B' },
      { id: '9', points: [{x: 240, y: 80}, {x: 240, y: 280}], arrowAt: 'end', dir: {x: 0, y: 1}, color: '#F4A041' }
    ]
  }
];

// ── Snake-Body Flow & Track Parameterization Helpers ─────────────────────────
function getDist(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function prepareTrack(path) {
  const pts = path.points;
  let rawTrack = [];
  if (path.arrowAt === 'start') {
    rawTrack = [...pts].reverse();
  } else {
    rawTrack = [...pts];
  }

  // Extend track by a long segment off-screen in the slide direction
  const lastPt = rawTrack[rawTrack.length - 1];
  const extensionLength = 1200;
  const extendedPt = {
    x: lastPt.x + path.dir.x * extensionLength,
    y: lastPt.y + path.dir.y * extensionLength,
  };
  const track = [...rawTrack, extendedPt];

  // Calculate cumulative lengths
  const lengths = [0];
  for (let i = 1; i < track.length; i++) {
    lengths.push(lengths[i - 1] + getDist(track[i - 1], track[i]));
  }

  // Original path length is the cumulative distance up to the second-to-last point (before extension)
  const snakeLength = lengths[lengths.length - 2];

  return { track, lengths, snakeLength };
}

function getPointAtDistance(track, lengths, d) {
  if (d <= 0) return { ...track[0] };
  const maxL = lengths[lengths.length - 1];
  if (d >= maxL) return { ...track[track.length - 1] };

  let idx = 0;
  for (let i = 0; i < lengths.length - 1; i++) {
    if (d >= lengths[i] && d <= lengths[i + 1]) {
      idx = i;
      break;
    }
  }

  const p1 = track[idx];
  const p2 = track[idx + 1];
  const segL = lengths[idx + 1] - lengths[idx];
  if (segL === 0) return { ...p1 };

  const ratio = (d - lengths[idx]) / segL;
  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio,
  };
}

function sliceTrack(track, lengths, d1, d2) {
  const pts = [];
  
  pts.push(getPointAtDistance(track, lengths, d1));

  for (let i = 0; i < track.length; i++) {
    if (lengths[i] > d1 && lengths[i] < d2) {
      pts.push({ ...track[i] });
    }
  }

  pts.push(getPointAtDistance(track, lengths, d2));

  const filtered = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const dist = getDist(filtered[filtered.length - 1], pts[i]);
    if (dist > 0.1) {
      filtered.push(pts[i]);
    }
  }

  return filtered;
}

// ── Collision Detection Helpers ──────────────────────────────────────────────
function getPointToSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

function checkSegmentsIntersection(ax, ay, bx, by, cx, cy, dx, dy) {
  const det = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (det === 0) return false; // Parallel
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / det;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / det;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function getSegmentsDistance(ax, ay, bx, by, cx, cy, dx, dy) {
  if (checkSegmentsIntersection(ax, ay, bx, by, cx, cy, dx, dy)) {
    return 0;
  }
  return Math.min(
    getPointToSegmentDistance(ax, ay, cx, cy, dx, dy),
    getPointToSegmentDistance(bx, by, cx, cy, dx, dy),
    getPointToSegmentDistance(cx, cy, ax, ay, bx, by),
    getPointToSegmentDistance(dx, dy, ax, ay, bx, by)
  );
}

function checkPathCollision(activePath, otherPaths) {
  // Combined radius threshold for 6px stroke lines
  const threshold = 8.5;

  for (const other of otherPaths) {
    if (other.cleared) continue;

    for (let i = 0; i < activePath.currentPoints.length - 1; i++) {
      const ax = activePath.currentPoints[i].x;
      const ay = activePath.currentPoints[i].y;
      const bx = activePath.currentPoints[i + 1].x;
      const by = activePath.currentPoints[i + 1].y;

      for (let j = 0; j < other.currentPoints.length - 1; j++) {
        const cx = other.currentPoints[j].x;
        const cy = other.currentPoints[j].y;
        const dx = other.currentPoints[j + 1].x;
        const dy = other.currentPoints[j + 1].y;

        const dist = getSegmentsDistance(ax, ay, bx, by, cx, cy, dx, dy);
        if (dist < threshold) {
          return true;
        }
      }
    }
  }
  return false;
}

function checkIsOffScreen(path) {
  const margin = 50;
  return path.currentPoints.every(pt => {
    return pt.x < -margin || pt.x > CANVAS_SIZE + margin || pt.y < -margin || pt.y > CANVAS_SIZE + margin;
  });
}

// ── Screen Component ─────────────────────────────────────────────────────────
export default function ArrowEscapeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();

  const [currentLevel, setCurrentLevel] = useState(1);
  const [hearts, setHearts] = useState(5);
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'failed' | 'won'
  const [paths, setPaths] = useState([]);

  // Use refs for animation loop values to avoid stale states
  const pathsRef = useRef([]);
  const animationFrameId = useRef(null);
  const isSlidingRef = useRef(false);

  // Load level geometry
  const loadLevel = (lvlIndex) => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    isSlidingRef.current = false;

    const lvlData = LEVELS[lvlIndex - 1] || LEVELS[0];
    const initialPaths = lvlData.paths.map(p => {
      const trackData = prepareTrack(p);
      return {
        ...p,
        offsetX: 0,
        offsetY: 0,
        distance: 0,
        track: trackData.track,
        lengths: trackData.lengths,
        snakeLength: trackData.snakeLength,
        currentPoints: sliceTrack(trackData.track, trackData.lengths, 0, trackData.snakeLength),
        cleared: false,
        isShaking: false,
      };
    });

    pathsRef.current = initialPaths;
    setPaths(initialPaths);
    setHearts(5);
    setGameState('playing');
  };

  useEffect(() => {
    loadLevel(currentLevel);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [currentLevel]);

  // SVG helper to format points into Path data string
  const getPathData = (points, ox = 0, oy = 0) => {
    if (points.length === 0) return '';
    return points.reduce((acc, pt, idx) => {
      const x = pt.x + ox;
      const y = pt.y + oy;
      return acc + (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  // Tapping path handler
  const handlePathTap = (pathId) => {
    if (gameState !== 'playing' || isSlidingRef.current) return;

    const activeIndex = pathsRef.current.findIndex(p => p.id === pathId);
    if (activeIndex === -1 || pathsRef.current[activeIndex].cleared) return;

    isSlidingRef.current = true;
    GameHaptics.correct();

    const path = pathsRef.current[activeIndex];
    const speed = 10; // Slide speed px/frame
    let curDistance = 0;

    const slideTick = () => {
      curDistance += speed;

      const slicedPts = sliceTrack(path.track, path.lengths, curDistance, curDistance + path.snakeLength);
      const updatedPath = { ...path, distance: curDistance, currentPoints: slicedPts };
      const otherPaths = pathsRef.current.filter(p => p.id !== pathId);

      // Check collision
      const isCollided = checkPathCollision(updatedPath, otherPaths);
      if (isCollided) {
        GameHaptics.incorrect();
        triggerShake(pathId, curDistance);
        return;
      }

      // Check if offscreen
      const offScreen = checkIsOffScreen(updatedPath);
      if (offScreen) {
        triggerCleared(pathId);
        return;
      }

      // Update in state and refs
      pathsRef.current = pathsRef.current.map(p =>
        p.id === pathId ? updatedPath : p
      );
      setPaths([...pathsRef.current]);

      animationFrameId.current = requestAnimationFrame(slideTick);
    };

    animationFrameId.current = requestAnimationFrame(slideTick);
  };

  // Shake / Collision handler
  const triggerShake = (pathId, finalDistance) => {
    const activePathIndex = pathsRef.current.findIndex(p => p.id === pathId);
    if (activePathIndex === -1) return;
    const path = pathsRef.current[activePathIndex];

    setHearts(prev => {
      const nextHearts = prev - 1;
      if (nextHearts <= 0) {
        setGameState('failed');
      }
      return nextHearts;
    });

    let frame = 0;
    const shakeTick = () => {
      if (frame >= 14) {
        // Reset to original position
        pathsRef.current = pathsRef.current.map(p =>
          p.id === pathId ? {
            ...p,
            distance: 0,
            currentPoints: sliceTrack(p.track, p.lengths, 0, p.snakeLength)
          } : p
        );
        setPaths([...pathsRef.current]);
        isSlidingRef.current = false;
        return;
      }

      // Slide back and forth along the perpendicular axis for high-frequency shake
      const scale = Math.max(0, 1 - frame / 14); // Dampen shake
      const dx = (frame % 2 === 0 ? 5 : -5) * scale * path.dir.y;
      const dy = (frame % 2 === 0 ? 5 : -5) * scale * path.dir.x;

      // Blend between collision position and origin slightly
      const blendFactor = frame / 14;
      const currentDistance = finalDistance * (1 - blendFactor);
      
      const slicedPts = sliceTrack(path.track, path.lengths, currentDistance, currentDistance + path.snakeLength);
      const shakenPts = slicedPts.map(pt => ({ x: pt.x + dx, y: pt.y + dy }));

      pathsRef.current = pathsRef.current.map(p =>
        p.id === pathId ? { ...p, distance: currentDistance, currentPoints: shakenPts } : p
      );
      setPaths([...pathsRef.current]);

      frame++;
      animationFrameId.current = requestAnimationFrame(shakeTick);
    };

    animationFrameId.current = requestAnimationFrame(shakeTick);
  };

  // Path Cleared handler
  const triggerCleared = (pathId) => {
    pathsRef.current = pathsRef.current.map(p =>
      p.id === pathId ? { ...p, cleared: true, distance: 9999, currentPoints: [] } : p
    );
    setPaths([...pathsRef.current]);
    isSlidingRef.current = false;
    GameHaptics.correct();

    // Check win state
    const allCleared = pathsRef.current.every(p => p.cleared);
    if (allCleared) {
      setGameState('won');
    }
  };

  // Restart / Reset level
  const resetLevel = () => {
    loadLevel(currentLevel);
    GameHaptics.correct();
  };

  // Progress to next level
  const nextLevel = () => {
    if (currentLevel < LEVELS.length) {
      setCurrentLevel(prev => prev + 1);
    } else {
      // Completed final level, loop back to 1
      setCurrentLevel(1);
    }
    GameHaptics.correct();
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.appBg, paddingTop: insets.top }]}>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              GameHaptics.correct();
              navigation.goBack();
            }}
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={resetLevel}>
            <RotateCcw size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: '#4A90E2' }]}>{t('games.arrowEscape.levelTitle', { level: currentLevel })}</Text>
          <View style={styles.heartsRow}>
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                size={14}
                color={i < hearts ? '#FF5E5B' : '#C7C4C0'}
                fill={i < hearts ? '#FF5E5B' : 'none'}
                style={{ marginHorizontal: 2 }}
              />
            ))}
          </View>
        </View>

        <View style={{ width: 84, alignItems: 'flex-end', justifyContent: 'center' }}>
          <TouchableOpacity
            style={styles.designerBtn}
            onPress={() => {
              GameHaptics.correct();
              navigation.navigate('ArrowEscapeDesigner');
            }}
          >
            <Text style={[styles.designerBtnText, { color: Colors.textSecondary }]}>{t('games.arrowEscape.designBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Main Content Area ───────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Game board wrapper */}
        <View style={[styles.boardContainer, Shadow.md]}>
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
            {/* Draw active lines */}
            {paths.map(path => {
              if (path.cleared || !path.currentPoints || path.currentPoints.length === 0) return null;

              // Compute arrow head rotation angle based on the last segment of the sliced path
              const headPt = path.currentPoints[path.currentPoints.length - 1];
              const prevPt = path.currentPoints[path.currentPoints.length - 2] || headPt;
              const angleRad = Math.atan2(headPt.y - prevPt.y, headPt.x - prevPt.x);
              const angleDeg = (angleRad * 180) / Math.PI;

              return (
                <G key={path.id} onPress={() => handlePathTap(path.id)}>
                  {/* Invisible thick tap helper line to guarantee minimum tap target size */}
                  <Path
                    d={getPathData(path.currentPoints)}
                    stroke="transparent"
                    strokeWidth={24}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onPress={() => handlePathTap(path.id)}
                  />

                  {/* Visible styled path line */}
                  <Path
                    d={getPathData(path.currentPoints)}
                    stroke={path.color}
                    strokeWidth={6}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onPress={() => handlePathTap(path.id)}
                  />

                  {/* Styled arrowhead at correct endpoint */}
                  <G transform={`translate(${headPt.x}, ${headPt.y}) rotate(${angleDeg})`} onPress={() => handlePathTap(path.id)}>
                    <Path
                      d="M -8 -6 L 2 0 L -8 6"
                      stroke={path.color}
                      strokeWidth={4.5}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </G>
                </G>
              );
            })}
          </Svg>

          {/* Win/Lose state overlays */}
          {gameState === 'won' && (
            <View style={styles.overlay}>
              <Award size={48} color="#4A90E2" style={{ marginBottom: 12 }} />
              <Text style={styles.overlayTitle}>{t('games.arrowEscape.clearedTitle')}</Text>
              <Text style={styles.overlaySub}>{t('games.arrowEscape.clearedSub')}</Text>
              <TouchableOpacity style={styles.overlayBtn} onPress={nextLevel}>
                <Text style={styles.overlayBtnText}>
                  {currentLevel === LEVELS.length ? t('games.arrowEscape.designer.playAgain') : t('games.arrowEscape.nextLevel')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'failed' && (
            <View style={styles.overlay}>
              <Heart size={48} color="#FF5E5B" fill="#FF5E5B" style={{ marginBottom: 12 }} />
              <Text style={styles.overlayTitle}>{t('games.arrowEscape.gameOverTitle')}</Text>
              <Text style={styles.overlaySub}>{t('games.arrowEscape.gameOverSub')}</Text>
              <TouchableOpacity style={[styles.overlayBtn, { backgroundColor: '#FF5E5B' }]} onPress={resetLevel}>
                <Text style={styles.overlayBtnText}>{t('games.arrowEscape.tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instructional caption */}
        <View style={styles.captionContainer}>
          <HelpCircle size={16} color="#8F857D" style={{ marginRight: 8 }} />
          <Text style={styles.captionText}>
            {t(`games.arrowEscape.level.${currentLevel}.description`) || t('games.arrowEscape.instructions')}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles Definition ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    height: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 18,
  },
  heartsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  designerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#EFE5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  designerBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing[8],
  },
  boardContainer: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: '#EFE5E0',
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[5],
  },
  overlayTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 22,
    color: '#3C3530',
    marginBottom: 4,
  },
  overlaySub: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: '#8F857D',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: Spacing[5],
    paddingHorizontal: Spacing[2],
  },
  overlayBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[6],
    paddingVertical: 12,
    ...Shadow.sm,
  },
  overlayBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[6],
    maxWidth: CANVAS_SIZE,
  },
  captionText: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: '#8F857D',
    lineHeight: 15,
  },
});
