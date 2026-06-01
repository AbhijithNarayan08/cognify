// src/features/train/games/PatternFold.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { PATTERN_FOLD } from '../../../constants/gameConfig';
import { Typography, Spacing, Radius, Shadow } from '../../../theme';

const { width } = Dimensions.get('window');

// Base 3x3 shapes library at 0° rotation
const BASE_SHAPES = {
  T:     [{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:1,c:1},{r:2,c:1}],
  L:     [{r:0,c:0},{r:1,c:0},{r:2,c:0},{r:2,c:1},{r:2,c:2}],
  F:     [{r:0,c:0},{r:0,c:1},{r:1,c:0},{r:1,c:1},{r:2,c:0}],
  Z:     [{r:0,c:0},{r:0,c:1},{r:1,c:1},{r:1,c:2},{r:2,c:2}],
  Cross: [{r:0,c:1},{r:1,c:0},{r:1,c:1},{r:1,c:2},{r:2,c:1}]
};

const COLOR_PALETTE = ['pink', 'blue', 'amber'];

// Core Transformation Functions
function rotateBlocks(blocks, angleDeg) {
  let result = blocks.map(b => ({ ...b }));
  const cycles = Math.round(angleDeg / 90) % 4;
  for (let c = 0; c < cycles; c++) {
    result = result.map(b => ({ r: b.c, c: 2 - b.r, color: b.color }));
  }
  return result;
}

function mirrorBlocks(blocks) {
  return blocks.map(b => ({ r: b.r, c: 2 - b.c, color: b.color }));
}

function colorizeBlocks(blocks, numColors, Colors) {
  const resolvedPalette = Colors ? [
    Colors.domain.spatial.main, // pink
    '#0073E6',                 // blue
    '#F4A041'                  // amber
  ] : COLOR_PALETTE;

  return blocks.map((b, i) => ({
    ...b,
    color: resolvedPalette[
      numColors === 1 ? 0 :
      numColors === 2 ? (i < Math.ceil(blocks.length / 2) ? 0 : 1) :
      i % numColors
    ]
  }));
}

// Canonical Hash Function
function canonicalHash(blocks) {
  return blocks
    .map(b => `${b.r},${b.c},${b.color}`)
    .sort()
    .join('|');
}

// Degeneracy Check
function getNonDegenerateAngles(blocks) {
  const baseHash = canonicalHash(blocks);
  return [90, 180, 270].filter(angle =>
    canonicalHash(rotateBlocks(blocks, angle)) !== baseHash
  );
}

// Collision Guard
function tryAddCandidate(blocks, foilType, candidates, usedHashes, angle) {
  const hash = canonicalHash(blocks);
  if (usedHashes.has(hash)) {
    return false; // duplicate — reject silently, try next strategy
  }
  usedHashes.add(hash);
  candidates.push({
    blocks,
    foilType,
    angle,
    isCorrect: foilType === 'correct',
    isMirror: foilType === 'mirror'
  });
  return true;
}

// Fisher-Yates Shuffle helper
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Validation Assertions
function validateRoundData(roundData, Colors) {
  const { candidates, correctIndex, shapeName, correctAngle, numColors } = roundData;
  const hashes = candidates.map(c => canonicalHash(c.blocks));
  
  if (new Set(hashes).size !== 4) {
    throw new Error(`Pattern Fold Validation Error: Duplicate candidates detected in round generation! Hashes: ${JSON.stringify(hashes)}`);
  }
  if (correctIndex < 0 || correctIndex > 3) {
    throw new Error(`Pattern Fold Validation Error: Invalid correctIndex: ${correctIndex}`);
  }
  const expectedCorrectHash = canonicalHash(
    rotateBlocks(colorizeBlocks(BASE_SHAPES[shapeName], numColors, Colors), correctAngle)
  );
  if (hashes[correctIndex] !== expectedCorrectHash) {
    throw new Error(`Pattern Fold Validation Error: Correct candidate block structure does not match expected rotation!`);
  }
  const baseHash = canonicalHash(colorizeBlocks(BASE_SHAPES[shapeName], numColors, Colors));
  const isFullyDegenerate = getNonDegenerateAngles(colorizeBlocks(BASE_SHAPES[shapeName], numColors, Colors)).length === 0;
  if (!isFullyDegenerate && hashes[correctIndex] === baseHash) {
    throw new Error(`Pattern Fold Validation Error: Correct candidate matches unrotated base shape (fully degenerate rotation selected).`);
  }
}

// Full Round Generation Algorithm
function generateRoundAlgorithm(shapeName, numColors, Colors) {
  // --- Stage 0: prepare base shape ---
  const rawBase = BASE_SHAPES[shapeName];
  const base = colorizeBlocks(rawBase, numColors, Colors);

  // --- Stage 1: pick correct angle ---
  let validAngles = getNonDegenerateAngles(base);
  if (validAngles.length === 0) {
    // If the shape is fully degenerate (e.g. Cross at single-color), fallback to any standard angle.
    // The collision guard in stages 3-6 will cleanly manage uniqueness by filtering duplicate layouts.
    validAngles = [90, 180, 270];
  }
  const correctAngle = validAngles[Math.floor(Math.random() * validAngles.length)];
  const correctBlocks = rotateBlocks(base, correctAngle);

  // --- Stage 2: init candidates + hash registry ---
  const candidates = [];
  const usedHashes = new Set();
  tryAddCandidate(correctBlocks, 'correct', candidates, usedHashes, correctAngle);

  // --- Stage 3: angle foil ---
  const wrongAngles = shuffle([90, 180, 270]).filter(a => {
    const h = canonicalHash(rotateBlocks(base, a));
    return !usedHashes.has(h);
  });
  if (wrongAngles.length > 0) {
    const wa = wrongAngles[0];
    tryAddCandidate(rotateBlocks(base, wa), 'angle', candidates, usedHashes, wa);
  }

  // --- Stage 4: mirror trap foil ---
  if (candidates.length < 4) {
    const mirrorBase = mirrorBlocks(base);
    const mirrorAngles = shuffle([0, 90, 180, 270]);
    for (const ma of mirrorAngles) {
      const placed = tryAddCandidate(
        rotateBlocks(mirrorBase, ma), 'mirror', candidates, usedHashes, ma
      );
      if (placed) break;
    }
  }

  // --- Stage 5: chirality foil ---
  if (candidates.length < 4) {
    const otherShapes = shuffle(Object.keys(BASE_SHAPES).filter(s => s !== shapeName));
    let placed = false;
    for (const s of otherShapes) {
      const chiralBase = colorizeBlocks(BASE_SHAPES[s], numColors, Colors);
      for (const ca of shuffle([0, 90, 180, 270])) {
        if (tryAddCandidate(
          rotateBlocks(chiralBase, ca), 'chirality', candidates, usedHashes, ca
        )) {
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  // --- Stage 6: fallback exhaustion loop ---
  while (candidates.length < 4) {
    let placed = false;
    for (const s of shuffle(Object.keys(BASE_SHAPES))) {
      const fb = colorizeBlocks(BASE_SHAPES[s], numColors, Colors);
      for (const fa of shuffle([0, 90, 180, 270])) {
        if (tryAddCandidate(
          rotateBlocks(fb, fa), 'fallback', candidates, usedHashes, fa
        )) {
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
    if (!placed) {
      throw new Error(`Cannot generate 4 unique candidates for ${shapeName} at numColors=${numColors}`);
    }
  }

  // --- Stage 7: shuffle and record correct index ---
  const shuffled = shuffle(candidates);
  const correctIndex = shuffled.findIndex(c => c.foilType === 'correct');

  // Verify and assert round data validation rules
  validateRoundData({
    candidates: shuffled,
    correctIndex,
    shapeName,
    correctAngle,
    numColors
  }, Colors);

  return {
    candidates: shuffled,
    correctIndex,
    shapeName,
    correctAngle,
    numColors
  };
}

export default function PatternFold({ level, isActive, onRoundComplete, Colors }) {
  const config = PATTERN_FOLD.levels[level] || PATTERN_FOLD.levels[1];
  const timingConfig = PATTERN_FOLD.timingLevels[level] || PATTERN_FOLD.timingLevels[1];

  // Game state
  const [targetShape, setTargetShape] = useState(null);
  const [variantsList, setVariantsList] = useState([]);
  const [correctVariantIndex, setCorrectVariantIndex] = useState(-1);
  const [roundPhase, setRoundPhase] = useState('stimulus'); // 'stimulus' | 'feedback'
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(-1);
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'correct' | 'incorrect' | 'timeout'
  
  // Animation ref
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Refs for tracking timestamps & timeouts
  const roundStartTimeRef = useRef(0);
  const timeoutsRef = useRef([]);
  const isComponentActive = useRef(isActive);
  const hasAnsweredRef = useRef(false);
  const targetShapeIdRef = useRef('');

  // Sync active ref
  useEffect(() => {
    isComponentActive.current = isActive;
    if (!isActive) {
      clearAllTimers();
    } else if (roundPhase === 'stimulus' && targetShape === null) {
      generateRound();
    }
  }, [isActive]);

  const clearAllTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const generateRound = () => {
    if (!isComponentActive.current) return;

    clearAllTimers();
    hasAnsweredRef.current = false;
    setSelectedVariantIndex(-1);
    setFeedbackStatus(null);
    rotateAnim.setValue(0);
    setRoundPhase('stimulus');

    // 1. Select random base shape name
    const shapeKeys = Object.keys(BASE_SHAPES);
    const shapeName = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
    targetShapeIdRef.current = shapeName;
    
    // Resolve color segment count by rotationType difficulty in level config
    const numColors = config.rotationType === '2D' ? 1 : (config.rotationType === '2D_3D' ? 2 : 3);

    // 2. Generate round candidates using specification-compliant algorithm
    const roundData = generateRoundAlgorithm(shapeName, numColors, Colors);

    // 3. Set target shape (unrotated base blocks colorized appropriately)
    const baseBlocks = colorizeBlocks(BASE_SHAPES[shapeName], numColors, Colors);
    setTargetShape(baseBlocks);

    // 4. Update variants list and correct variant index
    setVariantsList(roundData.candidates);
    setCorrectVariantIndex(roundData.correctIndex);

    roundStartTimeRef.current = Date.now();

    // 5. Response window timeout limit
    const responseTimeout = setTimeout(() => {
      if (!isComponentActive.current || hasAnsweredRef.current) return;
      handleAnswer(-1); // Timeout
    }, timingConfig.responseWindow);

    timeoutsRef.current.push(responseTimeout);
  };

  // Start round on level load
  useEffect(() => {
    if (isActive && targetShape === null) {
      generateRound();
    }
  }, [isActive, level]);

  const handlePressVariant = (idx) => {
    if (roundPhase !== 'stimulus' || hasAnsweredRef.current || !isComponentActive.current) return;
    handleAnswer(idx);
  };

  const handleAnswer = (selectedIdx) => {
    if (targetShape === null) return;
    hasAnsweredRef.current = true;
    setSelectedVariantIndex(selectedIdx);
    
    const responseTime = Date.now() - roundStartTimeRef.current;
    
    const isCorrect = selectedIdx === correctVariantIndex;
    const selectedVariant = variantsList[selectedIdx];
    const isMirrorError = selectedVariant && selectedVariant.isMirror;

    setFeedbackStatus(isCorrect ? 'correct' : (selectedIdx === -1 ? 'timeout' : 'incorrect'));
    setRoundPhase('feedback');

    // Visual rotation animation (300ms easing cubic)
    const correctAngleVal = variantsList[correctVariantIndex]?.angle || 90;
    
    Animated.timing(rotateAnim, {
      toValue: correctAngleVal,
      duration: PATTERN_FOLD.ROTATION_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Calculate score
    const baseScore = isCorrect ? 100 : 0;
    const speedBonus = isCorrect && responseTime < (timingConfig.responseWindow * PATTERN_FOLD.SPEED_BONUS_THRESHOLD)
      ? PATTERN_FOLD.SPEED_BONUS_POINTS
      : 0;

    // Resolve color segment count by rotationType difficulty in level config
    const numColors = config.rotationType === '2D' ? 1 : (config.rotationType === '2D_3D' ? 2 : 3);

    // Detailed round telemetry log
    const roundLogEntry = {
      targetShape: targetShapeIdRef.current,
      targetAngle: variantsList[correctVariantIndex]?.angle || 90,
      selectedAngle: selectedVariant ? selectedVariant.angle : null,
      foilTypeSelected: selectedVariant ? (selectedVariant.foilType || null) : null,
      correct: isCorrect,
      timedOut: selectedIdx === -1,
      reactionTimeMs: selectedIdx === -1 ? timingConfig.responseWindow : responseTime,
      eliteSpeed: isCorrect && responseTime <= timingConfig.responseWindow * PATTERN_FOLD.SPEED_BONUS_THRESHOLD,
      level: level,
      colorSegments: numColors
    };

    // Invoke runner callback
    onRoundComplete({
      isCorrect,
      scoreProps: {
        baseScore,
        speedBonus,
        maxScore: 100,
      },
      metrics: {
        isMirrorError,
        reactionTimeMs: responseTime,
        roundLogEntry,
      },
    });

    // Auto-advance after feedback duration (500ms + animation buffer)
    const feedbackTimeout = setTimeout(() => {
      if (!isComponentActive.current) return;
      setTargetShape(null);
      generateRound();
    }, PATTERN_FOLD.FEEDBACK_DURATION_MS + 200);

    timeoutsRef.current.push(feedbackTimeout);
  };

  // Helper to render active blocks in a 3x3 container
  const renderShapeGrid = (blocks, containerSize = 64) => {
    if (!blocks) return null;
    const cellSize = (containerSize - 4) / 3;

    return (
      <View style={[styles.gridContainer, { width: containerSize, height: containerSize }]}>
        {blocks.map((b, idx) => (
          <View
            key={idx}
            style={[
              styles.block,
              {
                width: cellSize - 2,
                height: cellSize - 2,
                borderRadius: 4,
                position: 'absolute',
                top: b.r * cellSize + 2,
                left: b.c * cellSize + 2,
                backgroundColor: b.color || Colors.domain.spatial.main,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const interpolatedRotation = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.layoutContainer}>
        {/* Left Side: Target Pattern Card */}
        {targetShape && (
          <View style={styles.leftColumn}>
            <Text style={[styles.columnTitle, { color: Colors.textSecondary }]}>target</Text>
            <Animated.View style={[
              styles.targetCard, 
              Shadow.md,
              { transform: [{ rotate: interpolatedRotation }] }
            ]}>
              {renderShapeGrid(targetShape, 120)}
            </Animated.View>
          </View>
        )}

        {/* Right Side: Rotated Variant Options Card list */}
        <View style={styles.rightColumn}>
          <Text style={[styles.columnTitle, { color: Colors.textSecondary }]}>select match</Text>
          <View style={styles.variantsGrid}>
            {variantsList.map((variant, idx) => {
              const isSelected = selectedVariantIndex === idx;
              const isCorrectAns = idx === correctVariantIndex;

              let cardBorderColor = Colors.border;
              let cardBg = Colors.surface;

              if (roundPhase === 'feedback') {
                if (isCorrectAns) {
                  cardBorderColor = '#3DC27A'; // Correct variant glows green
                  cardBg = '#E6F5EE';
                } else if (isSelected) {
                  cardBorderColor = '#E24B4A'; // Wrong variant clicked flashes red
                  cardBg = '#FFE8E7';
                }
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.variantCard,
                    Shadow.sm,
                    { borderColor: cardBorderColor, borderWidth: 2, backgroundColor: cardBg }
                  ]}
                  onPress={() => handlePressVariant(idx)}
                  disabled={roundPhase === 'feedback' || !isActive}
                  activeOpacity={0.8}
                >
                  {renderShapeGrid(variant.blocks, 56)}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutContainer: {
    flexDirection: width <= 320 ? 'column' : 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    gap: Spacing[6],
  },
  leftColumn: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  rightColumn: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  columnTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    marginBottom: Spacing[1],
  },
  targetCard: {
    backgroundColor: '#FFFFFF',
    width: 150,
    height: 150,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 172,
    gap: 12,
    justifyContent: 'center',
  },
  variantCard: {
    backgroundColor: '#FFFFFF',
    width: 76,
    height: 76,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    position: 'relative',
  },
  block: {
    ...Shadow.sm,
  },
});
