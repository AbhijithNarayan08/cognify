// src/features/train/games/FlashSort/FlashSortTapZones.js
import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function FlashSortTapZones({
  isActive,
  onResponse,
}) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const handleTouchStart = (e) => {
    if (!isActive) return;
    const touch = e.nativeEvent;
    touchStartRef.current = {
      x: touch.locationX || touch.pageX,
      y: touch.locationY || touch.pageY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e) => {
    if (!isActive) return;
    const touch = e.nativeEvent;
    const endX = touch.locationX || touch.pageX;
    const endY = touch.pageY || touch.locationY;
    const endTime = Date.now();

    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const startTime = touchStartRef.current.time;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const duration = endTime - startTime;

    // Midpoint check
    const midX = screenWidth / 2;

    // Detect swipe (horizontal displacement > 30pt within 300ms)
    if (duration < 300 && Math.abs(deltaX) > 30) {
      if (deltaX < 0) {
        // Left Swipe -> Circle
        onResponse('left', startTime);
      } else {
        // Right Swipe -> Square
        onResponse('right', startTime);
      }
      return;
    }

    // Default to tap: evaluate starting touch coordinate X
    if (startX < midX) {
      onResponse('left', startTime);
    } else {
      onResponse('right', startTime);
    }
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      collapsable={false}
    />
  );
}
