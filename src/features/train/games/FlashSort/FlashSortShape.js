// src/features/train/games/FlashSort/FlashSortShape.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, ClipPath, Circle, Rect, Ellipse, Line } from 'react-native-svg';
import { FLASH_SORT } from '../../../../constants/gameConfig';

export default function FlashSortShape({
  shapeType,
  distractorType,
  color,
  Colors,
  feedbackColor,
}) {
  const size = FLASH_SORT.SHAPE_SIZE_PT;
  const isHighSimilarity = distractorType === 'high_similarity';
  const hasPattern = distractorType === 'pattern_stripes' || distractorType === 'pattern_colour';

  const defaultColor = Colors.textPrimary || '#1A1816';
  const domainColor = Colors.domain?.speed?.main || '#FFC000';

  // Determine base fill color
  let fillBg = defaultColor;
  if (feedbackColor) {
    fillBg = feedbackColor;
  } else if (distractorType === 'colour' || distractorType === 'pattern_colour') {
    fillBg = color || domainColor;
  } else if (distractorType === 'pattern_stripes') {
    fillBg = domainColor;
  }

  // Slanted diagonal lines for stripe pattern (45 degrees)
  const stripeLines = [];
  if (hasPattern) {
    const spacing = 8;
    for (let i = -size; i < size * 2; i += spacing) {
      stripeLines.push(
        <Line
          key={i}
          x1={i}
          y1={0}
          x2={i + size}
          y2={size}
          stroke={fillBg}
          strokeWidth={4}
          opacity={0.6}
        />
      );
    }
  }

  const renderShapeInsideClip = () => {
    if (shapeType === 'circle') {
      if (isHighSimilarity) {
        // squash vertically (aspect ratio 0.88:1)
        const rx = size / 2;
        const ry = (size * 0.88) / 2;
        return (
          <Ellipse
            cx={size / 2}
            cy={size / 2}
            rx={rx}
            ry={ry}
            fill={hasPattern ? 'transparent' : fillBg}
          />
        );
      } else {
        return (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2}
            fill={hasPattern ? 'transparent' : fillBg}
          />
        );
      }
    } else {
      // Square: slight rounding (8) or high similarity heavy rounding (28)
      const rx = isHighSimilarity ? 28 : FLASH_SORT.SQUARE_BORDER_RADIUS;
      return (
        <Rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={rx}
          ry={rx}
          fill={hasPattern ? 'transparent' : fillBg}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <ClipPath id="shapeClip">
            {shapeType === 'circle' ? (
              isHighSimilarity ? (
                <Ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={(size * 0.88) / 2} />
              ) : (
                <Circle cx={size / 2} cy={size / 2} r={size / 2} />
              )
            ) : (
              <Rect x={0} y={0} width={size} height={size} rx={isHighSimilarity ? 28 : FLASH_SORT.SQUARE_BORDER_RADIUS} ry={isHighSimilarity ? 28 : FLASH_SORT.SQUARE_BORDER_RADIUS} />
            )}
          </ClipPath>
        </Defs>

        {/* If pattern is active, render clipped background alternating stripes */}
        {hasPattern ? (
          <>
            {/* Background 20% opacity */}
            {shapeType === 'circle' ? (
              isHighSimilarity ? (
                <Ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={(size * 0.88) / 2} fill={fillBg} opacity={0.2} />
              ) : (
                <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={fillBg} opacity={0.2} />
              )
            ) : (
              <Rect x={0} y={0} width={size} height={size} rx={isHighSimilarity ? 28 : FLASH_SORT.SQUARE_BORDER_RADIUS} ry={isHighSimilarity ? 28 : FLASH_SORT.SQUARE_BORDER_RADIUS} fill={fillBg} opacity={0.2} />
            )}
            
            {/* Diagonals clipped to shape */}
            <Defs>
              {renderShapeInsideClip()}
            </Defs>
            <Defs />
            <Defs />
            <Svg width={size} height={size} clipPath="url(#shapeClip)">
              {stripeLines}
            </Svg>
          </>
        ) : (
          renderShapeInsideClip()
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: FLASH_SORT.SHAPE_SIZE_PT,
    height: FLASH_SORT.SHAPE_SIZE_PT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
