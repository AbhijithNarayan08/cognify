import React from 'react';
import Svg, { Path, Rect, Circle, Polygon, Defs, ClipPath, G } from 'react-native-svg';

// 1. Terrible: Blue Square, Sad face with tear
export const MoodTerrible = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x="15" y="15" width="70" height="70" rx="12" fill="#2A75D3" transform="rotate(-10 50 50)" />
    <G transform="translate(0, 5) rotate(-10 50 50)">
      {/* Eyes */}
      <Path d="M 35 48 Q 40 43 45 48" fill="none" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
      <Path d="M 55 48 Q 60 43 65 48" fill="none" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
      {/* Mouth */}
      <Path d="M 45 60 Q 50 55 55 60" fill="none" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
      {/* Tear */}
      <Path d="M 40 55 Q 40 65 45 65 Q 45 55 40 55" fill="#5EACFF" />
    </G>
  </Svg>
);

// 2. Poor: Yellow Hexagon, Anxious squiggly mouth
export const MoodPoor = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="#F4D03F" transform="rotate(10 50 50)" />
    <G transform="rotate(10 50 50)">
      {/* Eyes */}
      <Path d="M 35 40 L 45 45 M 35 45 L 45 40" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
      <Path d="M 55 45 L 65 40 M 55 40 L 65 45" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
      {/* Squiggly Mouth */}
      <Path d="M 35 60 L 42 55 L 50 60 L 58 55 L 65 60" fill="none" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

// 3. Ok: Purple Capsule, Smirk
export const MoodOk = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x="25" y="10" width="50" height="80" rx="25" fill="#9B59B6" transform="rotate(30 50 50)" />
    <G transform="translate(-5, -5) rotate(30 50 50)">
      {/* Eyes */}
      <Circle cx="40" cy="45" r="3" fill="#1A2A3A" />
      <Circle cx="60" cy="45" r="3" fill="#1A2A3A" />
      {/* Smirk Mouth */}
      <Path d="M 40 55 Q 55 60 65 50" fill="none" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
    </G>
  </Svg>
);

// 4. Good: Green Semicircle/Wedge, Surprised/Attentive
export const MoodGood = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M 20 20 Q 80 20 80 80 L 20 80 Z" fill="#2ECC71" transform="rotate(-15 50 50)" />
    <G transform="translate(-5, 5) rotate(-15 50 50)">
      {/* Big Eyes */}
      <Circle cx="45" cy="45" r="8" fill="#FFFFFF" />
      <Circle cx="47" cy="45" r="3" fill="#1A2A3A" />
      <Circle cx="65" cy="55" r="6" fill="#FFFFFF" />
      <Circle cx="66" cy="55" r="2.5" fill="#1A2A3A" />
      {/* Small Mouth */}
      <Circle cx="55" cy="65" r="2" fill="#1A2A3A" />
    </G>
  </Svg>
);

// 5. Great: Pink Blob, Happy Face
export const MoodGreat = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Blob Path */}
    <Path d="M 50 15 C 75 10 90 35 85 60 C 80 85 55 90 30 85 C 5 80 10 40 25 25 C 35 15 40 18 50 15 Z" fill="#F5B7B1" />
    <G transform="translate(0, 5)">
      {/* Closed Happy Eyes */}
      <Path d="M 35 45 Q 40 40 45 45" fill="none" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
      <Path d="M 55 45 Q 60 40 65 45" fill="none" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
      {/* Big Smile */}
      <Path d="M 35 55 Q 50 70 65 55" fill="none" stroke="#1A2A3A" strokeWidth="3" strokeLinecap="round" />
    </G>
  </Svg>
);
