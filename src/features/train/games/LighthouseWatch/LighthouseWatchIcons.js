// src/features/train/games/LighthouseWatch/LighthouseWatchIcons.js
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const ICONS = {
  // ── Target Shape ──────────────────────────────────────────────────────────
  target: {
    name: 'Star',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path
          d="M25,1 L32,15 L48,18 L36,29 L39,45 L25,37 L11,45 L14,29 L2,18 L18,15 Z"
          fill={color}
        />
      </Svg>
    ),
  },

  // ── Level 1 Distractors (Clearly Different) ──────────────────────────────
  triangle: {
    name: 'Triangle',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,2 L48,45 L2,45 Z" fill={color} />
      </Svg>
    ),
  },
  circle: {
    name: 'Circle',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,2 C37.7,2 48,12.3 48,25 C48,37.7 37.7,48 25,48 C12.3,48 2,37.7 2,25 C2,12.3 12.3,2 25,2 Z" fill={color} />
      </Svg>
    ),
  },
  hexagon: {
    name: 'Hexagon',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,2 L45,13.5 L45,36.5 L25,48 L5,36.5 L5,13.5 Z" fill={color} />
      </Svg>
    ),
  },

  // ── Level 2 Distractors (Similar Family) ──────────────────────────────────
  star4pt: {
    name: 'Four-Point Star',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,1 L29,18 L46,25 L29,32 L25,49 L21,32 L4,25 L21,18 Z" fill={color} />
      </Svg>
    ),
  },
  diamond: {
    name: 'Diamond',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,2 L48,25 L25,48 L2,25 Z" fill={color} />
      </Svg>
    ),
  },
  burst8pt: {
    name: 'Eight-Point Burst',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,1 L30,13 L43,9 L36,21 L48,25 L36,29 L43,41 L30,37 L25,49 L20,37 L7,41 L14,29 L2,25 L14,21 L7,9 L20,13 Z" fill={color} />
      </Svg>
    ),
  },

  // ── Level 3 Distractors (Near Identical) ──────────────────────────────────
  star6ptOverlaid: {
    name: 'Six-Point Star',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,1 L31,13 L44,13 L35,22 L41,34 L25,28 L9,34 L15,22 L6,13 L19,13 Z" fill={color} />
      </Svg>
    ),
  },

  // ── Level 4 Distractors (Star Variants) ───────────────────────────────────
  star6ptContinuous: {
    name: 'Six-Point Star Outline',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,2 L31,14 L44,14 L34,22 L40,34 L25,26 L10,34 L16,22 L6,14 L19,14 Z" fill={color} />
      </Svg>
    ),
  },
  sparkleElongated: {
    name: 'Sparkle',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Path d="M25,1 L28,21 L48,25 L28,29 L25,49 L22,29 L2,25 L22,21 Z" fill={color} />
      </Svg>
    ),
  },

  // ── Level 5 Distractors (Five vs Six Point Visual Match) ──────────────────
  star6ptMatch: {
    name: 'Six-Point Star Match',
    render: (color, size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        {/* Same overall proportions as target star, identical color space, but 6-pointed */}
        <Path d="M25,1 L31,13 L44,13 L35,22 L41,34 L25,28 L9,34 L15,22 L6,13 L19,13 Z" fill={color} />
      </Svg>
    ),
  },
};
