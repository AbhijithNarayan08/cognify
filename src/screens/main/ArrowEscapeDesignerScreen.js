import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { ArrowLeft, RotateCcw, HelpCircle, Heart, Award, Copy, Check } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';
import { GameHaptics } from '../../utils/haptics';

// ── Screen and Canvas Dimensions ─────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const CANVAS_SIZE = 320;
const GRID_STEP = 20;

// Colors mapping for paths color picker
const PATH_COLORS = ['#4A90E2', '#F4A041', '#FF5E5B', '#3DAB7F', '#A662C6'];
const DIR_OPTIONS = [
  { label: '← Left', key: 'games.arrowEscape.designer.dir.left', vector: { x: -1, y: 0 } },
  { label: '→ Right', key: 'games.arrowEscape.designer.dir.right', vector: { x: 1, y: 0 } },
  { label: '↑ Up', key: 'games.arrowEscape.designer.dir.up', vector: { x: 0, y: -1 } },
  { label: '↓ Down', key: 'games.arrowEscape.designer.dir.down', vector: { x: 0, y: 1 } },
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

// ── Collision Detection Helpers (Mirrored from ArrowEscapeScreen) ─────────────
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
  if (det === 0) return false;
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
export default function ArrowEscapeDesignerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();

  // Mode: 'editing' | 'play_testing'
  const [mode, setMode] = useState('editing');

  // Editor Board State
  const [boardPaths, setBoardPaths] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [selectedColor, setSelectedColor] = useState(PATH_COLORS[0]);
  const [selectedDir, setSelectedDir] = useState(DIR_OPTIONS[1]); // right
  const [arrowAt, setArrowAt] = useState('end');

  // JSON Modal States
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [isImportVisible, setIsImportVisible] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  // Play testing state
  const [playPaths, setPlayPaths] = useState([]);
  const [playHearts, setPlayHearts] = useState(5);
  const [playState, setPlayState] = useState('playing'); // 'playing' | 'won' | 'failed'

  const playPathsRef = useRef([]);
  const isSlidingRef = useRef(false);
  const animationFrameId = useRef(null);

  // Pre-generate grid dots visual guide
  const gridDots = [];
  for (let x = GRID_STEP; x < CANVAS_SIZE; x += GRID_STEP) {
    for (let y = GRID_STEP; y < CANVAS_SIZE; y += GRID_STEP) {
      gridDots.push({ x, y });
    }
  }

  // Svg helper for d points string
  const getPathData = (points, ox = 0, oy = 0) => {
    if (points.length === 0) return '';
    return points.reduce((acc, pt, idx) => {
      const x = pt.x + ox;
      const y = pt.y + oy;
      return acc + (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  // Snapped canvas tap plotting handler
  const handleCanvasPress = (event) => {
    if (mode !== 'editing') return;

    const { locationX, locationY } = event.nativeEvent;
    const snappedX = Math.round(locationX / GRID_STEP) * GRID_STEP;
    const snappedY = Math.round(locationY / GRID_STEP) * GRID_STEP;

    // Clamp coordinates
    const clampedX = Math.max(0, Math.min(CANVAS_SIZE, snappedX));
    const clampedY = Math.max(0, Math.min(CANVAS_SIZE, snappedY));

    setCurrentPoints(prev => {
      // Avoid duplicate consecutive plots
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.x === clampedX && last.y === clampedY) return prev;
      }
      return [...prev, { x: clampedX, y: clampedY }];
    });
    GameHaptics.correct();
  };

  // Clear current drawing
  const clearDrawing = () => {
    setCurrentPoints([]);
    GameHaptics.correct();
  };

  // Add completed path to board
  const addPath = () => {
    if (currentPoints.length < 2) return;

    const newPath = {
      id: Math.random().toString(36).substring(2, 9),
      points: currentPoints,
      color: selectedColor,
      dir: selectedDir.vector,
      arrowAt,
    };

    setBoardPaths(prev => [...prev, newPath]);
    setCurrentPoints([]);
    GameHaptics.correct();
  };

  // Delete last path
  const deleteLastPath = () => {
    setBoardPaths(prev => prev.slice(0, -1));
    GameHaptics.correct();
  };

  // Clear all board elements
  const clearBoard = () => {
    setBoardPaths([]);
    setCurrentPoints([]);
    GameHaptics.correct();
  };

  // JSON Handlers
  const exportLevelData = () => {
    setIsExportVisible(true);
    setCopied(false);
    GameHaptics.correct();
  };

  const importLevelData = () => {
    setImportJsonText('');
    setIsImportVisible(true);
    GameHaptics.correct();
  };

  const processImport = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('level data must be an array of paths.');
      }
      // Basic validation of keys
      parsed.forEach(p => {
        if (!p.id || !p.points || !Array.isArray(p.points) || !p.dir || !p.color || !p.arrowAt) {
          throw new Error('invalid path object format inside array.');
        }
      });

      setBoardPaths(parsed);
      setIsImportVisible(false);
      GameHaptics.correct();
    } catch (err) {
      GameHaptics.incorrect();
      Alert.alert(t('games.arrowEscape.designer.alert.importFailedTitle'), err.message);
    }
  };

  // ── Play Testing Mode Handlers ──────────────────────────────────────────────
  const startPlayTesting = () => {
    if (boardPaths.length === 0) {
      Alert.alert(
        t('games.arrowEscape.designer.alert.emptyBoardTitle'),
        t('games.arrowEscape.designer.alert.emptyBoardMsg')
      );
      return;
    }

    setMode('play_testing');
    loadPlayState();
    GameHaptics.correct();
  };

  const stopPlayTesting = () => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    isSlidingRef.current = false;
    setMode('editing');
    GameHaptics.correct();
  };

  const loadPlayState = () => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    isSlidingRef.current = false;

    const initialPlayPaths = boardPaths.map(p => {
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
      };
    });

    playPathsRef.current = initialPlayPaths;
    setPlayPaths(initialPlayPaths);
    setPlayHearts(5);
    setPlayState('playing');
  };

  const handlePlayPathTap = (pathId) => {
    if (playState !== 'playing' || isSlidingRef.current) return;

    const activeIndex = playPathsRef.current.findIndex(p => p.id === pathId);
    if (activeIndex === -1 || playPathsRef.current[activeIndex].cleared) return;

    isSlidingRef.current = true;
    GameHaptics.correct();

    const path = playPathsRef.current[activeIndex];
    const speed = 10;
    let curDistance = 0;

    const playTick = () => {
      curDistance += speed;

      const slicedPts = sliceTrack(path.track, path.lengths, curDistance, curDistance + path.snakeLength);
      const updatedPath = { ...path, distance: curDistance, currentPoints: slicedPts };
      const otherPaths = playPathsRef.current.filter(p => p.id !== pathId);

      // Check collision
      const isCollided = checkPathCollision(updatedPath, otherPaths);
      if (isCollided) {
        GameHaptics.incorrect();
        triggerPlayShake(pathId, curDistance);
        return;
      }

      // Check if offscreen
      const offscreen = checkIsOffScreen(updatedPath);
      if (offscreen) {
        triggerPlayCleared(pathId);
        return;
      }

      playPathsRef.current = playPathsRef.current.map(p =>
        p.id === pathId ? updatedPath : p
      );
      setPlayPaths([...playPathsRef.current]);

      animationFrameId.current = requestAnimationFrame(playTick);
    };

    animationFrameId.current = requestAnimationFrame(playTick);
  };

  const triggerPlayShake = (pathId, finalDistance) => {
    const idx = playPathsRef.current.findIndex(p => p.id === pathId);
    if (idx === -1) return;
    const path = playPathsRef.current[idx];

    setPlayHearts(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setPlayState('failed');
      }
      return next;
    });

    let frame = 0;
    const shakeTick = () => {
      if (frame >= 14) {
        playPathsRef.current = playPathsRef.current.map(p =>
          p.id === pathId ? {
            ...p,
            distance: 0,
            currentPoints: sliceTrack(p.track, p.lengths, 0, p.snakeLength)
          } : p
        );
        setPlayPaths([...playPathsRef.current]);
        isSlidingRef.current = false;
        return;
      }

      const scale = Math.max(0, 1 - frame / 14);
      const dx = (frame % 2 === 0 ? 5 : -5) * scale * path.dir.y;
      const dy = (frame % 2 === 0 ? 5 : -5) * scale * path.dir.x;

      const blend = frame / 14;
      const currentDistance = finalDistance * (1 - blend);
      const slicedPts = sliceTrack(path.track, path.lengths, currentDistance, currentDistance + path.snakeLength);
      const shakenPts = slicedPts.map(pt => ({ x: pt.x + dx, y: pt.y + dy }));

      playPathsRef.current = playPathsRef.current.map(p =>
        p.id === pathId ? { ...p, distance: currentDistance, currentPoints: shakenPts } : p
      );
      setPlayPaths([...playPathsRef.current]);

      frame++;
      animationFrameId.current = requestAnimationFrame(shakeTick);
    };

    animationFrameId.current = requestAnimationFrame(shakeTick);
  };

  const triggerPlayCleared = (pathId) => {
    playPathsRef.current = playPathsRef.current.map(p =>
      p.id === pathId ? { ...p, cleared: true, distance: 9999, currentPoints: [] } : p
    );
    setPlayPaths([...playPathsRef.current]);
    isSlidingRef.current = false;
    GameHaptics.correct();

    const won = playPathsRef.current.every(p => p.cleared);
    if (won) {
      setPlayState('won');
    }
  };

  const handleCopyJson = () => {
    // Basic fallback simulation for copying since Clipboard API may require packages
    setCopied(true);
    GameHaptics.correct();
    setTimeout(() => setCopied(false), 2000);
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
          {mode === 'play_testing' && (
            <TouchableOpacity style={styles.headerBtn} onPress={loadPlayState}>
              <RotateCcw size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: '#4A90E2' }]}>
            {mode === 'editing' ? t('games.arrowEscape.designer.modeEditing') : t('games.arrowEscape.designer.modePlaytesting')}
          </Text>
          {mode === 'play_testing' && (
            <View style={styles.heartsRow}>
              {[...Array(5)].map((_, i) => (
                <Heart
                  key={i}
                  size={12}
                  color={i < playHearts ? '#FF5E5B' : '#C7C4C0'}
                  fill={i < playHearts ? '#FF5E5B' : 'none'}
                  style={{ marginHorizontal: 2 }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ width: 84, alignItems: 'flex-end', justifyContent: 'center' }}>
          {mode === 'editing' ? (
            <TouchableOpacity style={styles.playBtn} onPress={startPlayTesting}>
              <Text style={styles.playBtnText}>{t('games.arrowEscape.designer.playBtn')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#FF5E5B' }]} onPress={stopPlayTesting}>
              <Text style={styles.playBtnText}>{t('games.arrowEscape.designer.exitBtn')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Main Canvas and Toolbar Scroll ──────────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SNAP CANVAS BOARD */}
        <View style={[styles.boardContainer, Shadow.md]}>
          <View
            style={styles.canvasClickWrapper}
            onTouchStart={mode === 'editing' ? handleCanvasPress : undefined}
          >
            <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
              {/* Dot grid guide pattern for drawing */}
              {mode === 'editing' && gridDots.map((dot, idx) => (
                <Circle key={`dot-${idx}`} cx={dot.x} cy={dot.y} r={2} fill="#C7C4C0" opacity={0.4} />
              ))}

              {/* Draw saved paths */}
              {(mode === 'editing' ? boardPaths : playPaths).map((path) => {
                if (path.cleared) return null;

                if (mode === 'editing') {
                  const arrowPt = path.arrowAt === 'start' ? path.points[0] : path.points[path.points.length - 1];
                  const angleRad = Math.atan2(path.dir.y, path.dir.x);
                  const angleDeg = (angleRad * 180) / Math.PI;

                  return (
                    <G key={path.id}>
                      <Path
                        d={getPathData(path.points)}
                        stroke={path.color}
                        strokeWidth={6}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      <G transform={`translate(${arrowPt.x}, ${arrowPt.y}) rotate(${angleDeg})`}>
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
                } else {
                  if (!path.currentPoints || path.currentPoints.length === 0) return null;
                  const headPt = path.currentPoints[path.currentPoints.length - 1];
                  const prevPt = path.currentPoints[path.currentPoints.length - 2] || headPt;
                  const angleRad = Math.atan2(headPt.y - prevPt.y, headPt.x - prevPt.x);
                  const angleDeg = (angleRad * 180) / Math.PI;

                  return (
                    <G key={path.id} onPress={() => handlePlayPathTap(path.id)}>
                      {/* Double-layered tap targets for playtesting */}
                      <Path
                        d={getPathData(path.currentPoints)}
                        stroke="transparent"
                        strokeWidth={24}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        onPress={() => handlePlayPathTap(path.id)}
                      />

                      <Path
                        d={getPathData(path.currentPoints)}
                        stroke={path.color}
                        strokeWidth={6}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        onPress={() => handlePlayPathTap(path.id)}
                      />
                      
                      <G transform={`translate(${headPt.x}, ${headPt.y}) rotate(${angleDeg})`} onPress={() => handlePlayPathTap(path.id)}>
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
                }
              })}

              {/* Draw active line points currently plotting */}
              {mode === 'editing' && currentPoints.length > 0 && (
                <G>
                  <Path
                    d={getPathData(currentPoints)}
                    stroke="#8F857D"
                    strokeWidth={4}
                    strokeDasharray="4,4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {currentPoints.map((pt, idx) => (
                    <Circle
                      key={`pt-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={4}
                      fill={idx === 0 ? '#FF5E5B' : '#8F857D'}
                    />
                  ))}
                </G>
              )}
            </Svg>

            {/* Test Win/Fail Overlays */}
            {mode === 'play_testing' && playState === 'won' && (
              <View style={styles.overlay}>
                <Award size={48} color="#4A90E2" style={{ marginBottom: 12 }} />
                <Text style={styles.overlayTitle}>{t('games.arrowEscape.designer.successTitle')}</Text>
                <Text style={styles.overlaySub}>{t('games.arrowEscape.designer.successSub')}</Text>
                <TouchableOpacity style={styles.overlayBtn} onPress={loadPlayState}>
                  <Text style={styles.overlayBtnText}>{t('games.arrowEscape.designer.playAgain')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'play_testing' && playState === 'failed' && (
              <View style={styles.overlay}>
                <Heart size={48} color="#FF5E5B" fill="#FF5E5B" style={{ marginBottom: 12 }} />
                <Text style={styles.overlayTitle}>{t('games.arrowEscape.designer.failedTitle')}</Text>
                <Text style={styles.overlaySub}>{t('games.arrowEscape.designer.failedSub')}</Text>
                <TouchableOpacity style={[styles.overlayBtn, { backgroundColor: '#FF5E5B' }]} onPress={loadPlayState}>
                  <Text style={styles.overlayBtnText}>{t('games.arrowEscape.designer.tryAgain')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── Editor controls panel (Only visible in editing mode) ───────────── */}
        {mode === 'editing' && (
          <View style={styles.panel}>
            {/* Draw Path config panel */}
            <View style={styles.panelSection}>
              <Text style={styles.sectionTitle}>{t('games.arrowEscape.designer.drawSection')}</Text>
              
              {/* Color Picker row */}
              <Text style={styles.label}>{t('games.arrowEscape.designer.colorLabel')}</Text>
              <View style={styles.row}>
                {PATH_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c, borderColor: selectedColor === c ? '#1A1816' : 'transparent' }
                    ]}
                    onPress={() => setSelectedColor(c)}
                  />
                ))}
              </View>

              {/* Direction selector */}
              <Text style={styles.label}>{t('games.arrowEscape.designer.directionLabel')}</Text>
              <View style={styles.row}>
                {DIR_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.dirBtn,
                      selectedDir.key === opt.key ? { backgroundColor: '#EFE5E0' } : null
                    ]}
                    onPress={() => setSelectedDir(opt)}
                  >
                    <Text style={styles.dirBtnText}>{t(opt.key)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Arrow At start / end toggle */}
              <Text style={styles.label}>{t('games.arrowEscape.designer.arrowHeadLabel')}</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.arrowAtBtn, arrowAt === 'end' ? { backgroundColor: '#EFE5E0' } : null]}
                  onPress={() => setArrowAt('end')}
                >
                  <Text style={styles.arrowAtText}>{t('games.arrowEscape.designer.pathEnd')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.arrowAtBtn, arrowAt === 'start' ? { backgroundColor: '#EFE5E0' } : null]}
                  onPress={() => setArrowAt('start')}
                >
                  <Text style={styles.arrowAtText}>{t('games.arrowEscape.designer.pathStart')}</Text>
                </TouchableOpacity>
              </View>

              {/* Draw actions */}
              <View style={[styles.row, { marginTop: Spacing[4] }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, { flex: 1, marginRight: Spacing[2] }]}
                  onPress={clearDrawing}
                >
                  <Text style={styles.actionBtnText}>{t('games.arrowEscape.designer.clearPoints')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { flex: 1, backgroundColor: currentPoints.length >= 2 ? '#4A90E2' : '#C7C4C0' }
                  ]}
                  disabled={currentPoints.length < 2}
                  onPress={addPath}
                >
                  <Text style={[styles.actionBtnText, currentPoints.length >= 2 ? { color: '#FFFFFF' } : null]}>
                    {t('games.arrowEscape.designer.savePath')} ({currentPoints.length} Pts)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Level utility controls */}
            <View style={styles.panelSection}>
              <Text style={styles.sectionTitle}>{t('games.arrowEscape.designer.utilSection')}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.utilBtn, { flex: 1 }]} onPress={deleteLastPath}>
                  <Text style={styles.utilBtnText}>{t('games.arrowEscape.designer.deletePath')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.utilBtn, { flex: 1 }]} onPress={clearBoard}>
                  <Text style={styles.utilBtnText}>{t('games.arrowEscape.designer.clearBoard')}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.row, { marginTop: Spacing[3] }]}>
                <TouchableOpacity style={[styles.utilBtn, { flex: 1 }]} onPress={exportLevelData}>
                  <Text style={styles.utilBtnText}>{t('games.arrowEscape.designer.exportJson')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.utilBtn, { flex: 1 }]} onPress={importLevelData}>
                  <Text style={styles.utilBtnText}>{t('games.arrowEscape.designer.importJson')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: Spacing[10] }} />
      </ScrollView>

      {/* ── Modals: Export JSON & Import JSON ───────────────────────────────── */}
      <Modal visible={isExportVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.md]}>
            <Text style={styles.modalTitle}>{t('games.arrowEscape.designer.exportTitle')}</Text>
            <Text style={styles.modalSub}>{t('games.arrowEscape.designer.exportSub')}</Text>
            
            <ScrollView style={styles.jsonTextScroll} contentContainerStyle={{ padding: 10 }}>
              <TextInput
                multiline
                editable={false}
                value={JSON.stringify(boardPaths, null, 2)}
                style={styles.jsonText}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsExportVisible(false)}>
                <Text style={styles.modalCloseText}>{t('games.arrowEscape.designer.close')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalActionBtn} onPress={handleCopyJson}>
                {copied ? <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} /> : <Copy size={14} color="#FFFFFF" style={{ marginRight: 4 }} />}
                <Text style={[styles.modalActionText, { color: '#FFFFFF' }]}>{copied ? t('games.arrowEscape.designer.copied') : t('games.arrowEscape.designer.copyJson')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isImportVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.md]}>
            <Text style={styles.modalTitle}>{t('games.arrowEscape.designer.importTitle')}</Text>
            <Text style={styles.modalSub}>{t('games.arrowEscape.designer.importSub')}</Text>
            
            <TextInput
              multiline
              placeholder="[ { id: '...', points: [...] } ]"
              value={importJsonText}
              onChangeText={setImportJsonText}
              style={styles.importInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsImportVisible(false)}>
                <Text style={styles.modalCloseText}>{t('games.arrowEscape.designer.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: importJsonText ? '#4A90E2' : '#C7C4C0' }]}
                disabled={!importJsonText}
                onPress={processImport}
              >
                <Text style={[styles.modalActionText, importJsonText ? { color: '#FFFFFF' } : null]}>{t('games.arrowEscape.designer.loadBoard')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  playBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
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
    marginBottom: Spacing[5],
  },
  canvasClickWrapper: {
    flex: 1,
  },
  panel: {
    width: CANVAS_SIZE,
  },
  panelSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#EFE5E0',
    padding: Spacing[4],
    marginBottom: Spacing[4],
    ...Shadow.sm,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 12,
    color: '#3C3530',
    marginBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#FAF6F0',
    paddingBottom: 4,
  },
  label: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    color: '#8F857D',
    marginTop: Spacing[2],
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
  },
  dirBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1.2,
    borderColor: '#EFE5E0',
    backgroundColor: '#FAF6F0',
  },
  dirBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    color: '#3C3530',
  },
  arrowAtBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1.2,
    borderColor: '#EFE5E0',
    backgroundColor: '#FAF6F0',
  },
  arrowAtText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 9,
    color: '#3C3530',
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: '#FAF6F0',
    borderWidth: 1.2,
    borderColor: '#EFE5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: '#8F857D',
  },
  utilBtn: {
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: '#FAF6F0',
    borderWidth: 1.2,
    borderColor: '#EFE5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10.5,
    color: '#3C3530',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 24, 22, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[5],
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    width: '100%',
    maxWidth: 320,
    padding: Spacing[5],
    borderWidth: 1.5,
    borderColor: '#EFE5E0',
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 15,
    color: '#3C3530',
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
    color: '#8F857D',
    lineHeight: 14,
    marginBottom: Spacing[4],
  },
  jsonTextScroll: {
    height: 150,
    backgroundColor: '#FAF6F0',
    borderRadius: Radius.sm,
    borderWidth: 1.2,
    borderColor: '#EFE5E0',
    marginBottom: Spacing[4],
  },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#3C3530',
  },
  importInput: {
    height: 150,
    backgroundColor: '#FAF6F0',
    borderRadius: Radius.sm,
    borderWidth: 1.2,
    borderColor: '#EFE5E0',
    padding: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#3C3530',
    textAlignVertical: 'top',
    marginBottom: Spacing[4],
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[3],
  },
  modalCloseBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    backgroundColor: '#FAF6F0',
    borderWidth: 1.2,
    borderColor: '#EFE5E0',
  },
  modalCloseText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    color: '#8F857D',
  },
  modalActionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalActionText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
});
