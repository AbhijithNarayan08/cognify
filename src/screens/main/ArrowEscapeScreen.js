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
    // Skip if other path was already cleared
    if (other.cleared) continue;

    for (let i = 0; i < activePath.points.length - 1; i++) {
      const ax = activePath.points[i].x + activePath.offsetX;
      const ay = activePath.points[i].y + activePath.offsetY;
      const bx = activePath.points[i + 1].x + activePath.offsetX;
      const by = activePath.points[i + 1].y + activePath.offsetY;

      for (let j = 0; j < other.points.length - 1; j++) {
        const cx = other.points[j].x + other.offsetX;
        const cy = other.points[j].y + other.offsetY;
        const dx = other.points[j + 1].x + other.offsetX;
        const dy = other.points[j + 1].y + other.offsetY;

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
  return path.points.every(pt => {
    const x = pt.x + path.offsetX;
    const y = pt.y + path.offsetY;
    return x < -margin || x > CANVAS_SIZE + margin || y < -margin || y > CANVAS_SIZE + margin;
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
    const initialPaths = lvlData.paths.map(p => ({
      ...p,
      offsetX: 0,
      offsetY: 0,
      cleared: false,
      isShaking: false,
    }));

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
    let curOx = 0;
    let curOy = 0;

    const slideTick = () => {
      curOx += path.dir.x * speed;
      curOy += path.dir.y * speed;

      // Create a temporary copy with updated offsets for collision checking
      const updatedPath = { ...path, offsetX: curOx, offsetY: curOy };
      const otherPaths = pathsRef.current.filter(p => p.id !== pathId);

      // Check collision
      const isCollided = checkPathCollision(updatedPath, otherPaths);
      if (isCollided) {
        GameHaptics.incorrect();
        triggerShake(pathId, curOx, curOy);
        return;
      }

      // Check if offscreen
      const offScreen = checkIsOffScreen(updatedPath);
      if (offScreen) {
        triggerCleared(pathId);
        return;
      }

      // Update offsets in state and refs
      pathsRef.current = pathsRef.current.map(p =>
        p.id === pathId ? { ...p, offsetX: curOx, offsetY: curOy } : p
      );
      setPaths([...pathsRef.current]);

      animationFrameId.current = requestAnimationFrame(slideTick);
    };

    animationFrameId.current = requestAnimationFrame(slideTick);
  };

  // Shake / Collision handler
  const triggerShake = (pathId, finalOx, finalOy) => {
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
          p.id === pathId ? { ...p, offsetX: 0, offsetY: 0 } : p
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
      const currentOx = finalOx * (1 - blendFactor) + dx;
      const currentOy = finalOy * (1 - blendFactor) + dy;

      pathsRef.current = pathsRef.current.map(p =>
        p.id === pathId ? { ...p, offsetX: currentOx, offsetY: currentOy } : p
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
      p.id === pathId ? { ...p, cleared: true, offsetX: 9999, offsetY: 9999 } : p
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
          <Text style={[styles.headerTitle, { color: '#4A90E2' }]}>level {currentLevel}</Text>
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
            <Text style={[styles.designerBtnText, { color: Colors.textSecondary }]}>design</Text>
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
              if (path.cleared) return null;

              // Compute arrow head rotation angle
              const arrowPt = path.arrowAt === 'start' ? path.points[0] : path.points[path.points.length - 1];
              const angleRad = Math.atan2(path.dir.y, path.dir.x);
              const angleDeg = (angleRad * 180) / Math.PI;

              return (
                <G key={path.id}>
                  {/* Invisible thick tap helper line to guarantee minimum tap target size */}
                  <Path
                    d={getPathData(path.points, path.offsetX, path.offsetY)}
                    stroke="transparent"
                    strokeWidth={24}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onPress={() => handlePathTap(path.id)}
                  />

                  {/* Visible styled path line */}
                  <Path
                    d={getPathData(path.points, path.offsetX, path.offsetY)}
                    stroke={path.color}
                    strokeWidth={6}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Styled arrowhead at correct endpoint */}
                  <G transform={`translate(${arrowPt.x + path.offsetX}, ${arrowPt.y + path.offsetY}) rotate(${angleDeg})`}>
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
              <Text style={styles.overlayTitle}>level cleared!</Text>
              <Text style={styles.overlaySub}>you escaped the gridlocks successfully.</Text>
              <TouchableOpacity style={styles.overlayBtn} onPress={nextLevel}>
                <Text style={styles.overlayBtnText}>
                  {currentLevel === LEVELS.length ? 'play again' : 'next level'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'failed' && (
            <View style={styles.overlay}>
              <Heart size={48} color="#FF5E5B" fill="#FF5E5B" style={{ marginBottom: 12 }} />
              <Text style={styles.overlayTitle}>no hearts left!</Text>
              <Text style={styles.overlaySub}>you hit too many blocks. reset to try again!</Text>
              <TouchableOpacity style={[styles.overlayBtn, { backgroundColor: '#FF5E5B' }]} onPress={resetLevel}>
                <Text style={styles.overlayBtnText}>try again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instructional caption */}
        <View style={styles.captionContainer}>
          <HelpCircle size={16} color="#8F857D" style={{ marginRight: 8 }} />
          <Text style={styles.captionText}>
            {LEVELS[currentLevel - 1]?.description || 'tap a line to slide it off the board.'}
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
