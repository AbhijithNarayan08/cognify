// src/features/train/games/PatternFold.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { PATTERN_FOLD } from '../../../constants/gameConfig';
import { Typography, Spacing, Radius, Shadow } from '../../../theme';

const { width } = Dimensions.get('window');

// Base 3x3 shapes
const BASE_SHAPES = [
  // T-shape
  { id: 'T', blocks: [{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:1,c:1},{r:2,c:1}] },
  // L-shape
  { id: 'L', blocks: [{r:0,c:0},{r:1,c:0},{r:2,c:0},{r:2,c:1},{r:2,c:2}] },
  // F-shape
  { id: 'F', blocks: [{r:0,c:0},{r:1,c:0},{r:2,c:0},{r:0,c:1},{r:1,c:1},{r:0,c:2}] },
  // Z-shape
  { id: 'Z', blocks: [{r:0,c:0},{r:0,c:1},{r:1,c:1},{r:1,c:2}] },
  // Cross
  { id: 'Cross', blocks: [{r:1,c:0},{r:1,c:1},{r:1,c:2},{r:0,c:1},{r:2,c:1}] },
];

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

  // Mathematical transformations for 3x3 grid blocks
  const rotateBlocks = (blocks, angleDeg) => {
    let result = [...blocks];
    const cycles = (angleDeg / 90) % 4;
    for (let c = 0; c < cycles; c++) {
      result = result.map((b) => ({
        r: b.c,
        c: 2 - b.r,
        color: b.color,
      }));
    }
    return result;
  };

  const mirrorBlocks = (blocks) => {
    return blocks.map((b) => ({
      r: b.r,
      c: 2 - b.c,
      color: b.color,
    }));
  };

  const generateRound = () => {
    if (!isComponentActive.current) return;

    clearAllTimers();
    hasAnsweredRef.current = false;
    setSelectedVariantIndex(-1);
    setFeedbackStatus(null);
    rotateAnim.setValue(0);
    setRoundPhase('stimulus');

    // 1. Select random base shape
    const base = BASE_SHAPES[Math.floor(Math.random() * BASE_SHAPES.length)];
    
    // Apply difficulty segment colors
    let coloredBlocks = base.blocks.map((b, idx) => {
      let blockColor = Colors.domain.spatial.main; // Default pink
      if (config.rotationType === '2D_3D' && idx % 2 === 0) {
        blockColor = '#0073E6'; // 2 colors max at level 3
      } else if (config.rotationType === '3D' || config.rotationType === '3D_iso') {
        // 3 colors max at level 4 & 5
        const colorPalette = [Colors.domain.spatial.main, '#0073E6', '#F4A041'];
        blockColor = colorPalette[idx % 3];
      }
      return { ...b, color: blockColor };
    });

    setTargetShape(coloredBlocks);

    // 2. Determine target correct rotation angle
    const angles = config.angles === 'any' ? [45, 90, 135, 180, 225, 270] : config.angles;
    const correctAngle = angles[Math.floor(Math.random() * angles.length)];

    // 3. Build variants list
    const variants = [];
    const correctVariant = {
      blocks: rotateBlocks(coloredBlocks, correctAngle),
      angle: correctAngle,
      isCorrect: true,
      isMirror: false,
    };
    variants.push(correctVariant);

    // Distractor 1: Mirror image (horizontal flip)
    if (config.mirrorsIncluded) {
      const mirrorAngle = angles[Math.floor(Math.random() * angles.length)];
      const mirrored = rotateBlocks(mirrorBlocks(coloredBlocks), mirrorAngle);
      variants.push({
        blocks: mirrored,
        angle: mirrorAngle,
        isCorrect: false,
        isMirror: true,
      });
    }

    // Distractor 2: Different rotation angle or different shape
    const otherAngles = angles.filter((a) => a !== correctAngle);
    const distractorAngle = otherAngles.length ? otherAngles[Math.floor(Math.random() * otherAngles.length)] : 270;
    variants.push({
      blocks: rotateBlocks(coloredBlocks, distractorAngle),
      angle: distractorAngle,
      isCorrect: false,
      isMirror: false,
    });

    // Distractor 3: Different shape or angle
    if (variants.length < config.variants) {
      const remainingAngle = (correctAngle + 180) % 360;
      variants.push({
        blocks: rotateBlocks(coloredBlocks, remainingAngle),
        angle: remainingAngle,
        isCorrect: false,
        isMirror: false,
      });
    }

    // Shuffle variants
    const shuffled = variants.sort(() => Math.random() - 0.5);
    setVariantsList(shuffled);

    // Find correct index
    const correctIdx = shuffled.findIndex((v) => v.isCorrect);
    setCorrectVariantIndex(correctIdx);

    roundStartTimeRef.current = Date.now();

    // 4. Response window timeout limit
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
    hasAnsweredRef.current = true;
    setSelectedVariantIndex(selectedIdx);
    
    const responseTime = Date.now() - roundStartTimeRef.current;
    
    const isCorrect = selectedIdx === correctVariantIndex;
    const selectedVariant = variantsList[selectedIdx];
    const isMirrorError = selectedVariant && selectedVariant.isMirror;

    setFeedbackStatus(isCorrect ? 'correct' : (selectedIdx === -1 ? 'timeout' : 'incorrect'));
    setRoundPhase('feedback');

    // Visual rotation animation (300ms easing cubic)
    // Animates target from 0 to correctAngle to kinetically line up blocks!
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
    textTransform: 'lowercase',
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
