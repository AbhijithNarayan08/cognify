// src/features/train/games/LighthouseWatch/index.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { useLighthouseWatchEngine } from './useLighthouseWatchEngine';
import LighthouseWatchStream from './LighthouseWatchStream';
import LighthouseWatchTapZone from './LighthouseWatchTapZone';
import LighthouseWatchFeedback from './LighthouseWatchFeedback';
import { Typography, Spacing } from '../../../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LighthouseWatch({
  level,
  isActive,
  onRoundComplete,
  Colors,
  multiplier = 1.0,
  streakCount = 0,
  onTimerStateChange,
}) {
  const engine = useLighthouseWatchEngine(level, isActive, onRoundComplete, multiplier);

  const {
    currentIcon,
    roundPhase,
    setRoundPhase,
    activeFeedback,
    handleTap,
    handleMiss,
    advanceStream,
    hits,
    misses,
    falseAlarms,
    longestStreak,
    config,
  } = engine;

  // Track active state transitions to notify timing machine
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.appBg }]}>
      {/* Tap Zone below header (covers full container) */}
      <LighthouseWatchTapZone isActive={isActive && roundPhase === 'stimulus'} onTap={handleTap} />

      {/* Top Zone: Info display (e.g. rounds played, current streak) */}
      <View style={styles.topZone} pointerEvents="none">
        <Text style={[styles.roundText, { color: Colors.textSecondary }]}>
          Vigilance Target: ★ Star
        </Text>
        {streakCount > 0 && (
          <Text style={[styles.streakText, { color: '#A662C6' }]}>
            {streakCount} Correct In A Row
          </Text>
        )}
      </View>

      {/* Main Animated Stream Display */}
      <View style={styles.streamContainer} pointerEvents="none">
        <LighthouseWatchStream
          currentIcon={currentIcon}
          roundPhase={roundPhase}
          setRoundPhase={setRoundPhase}
          config={config}
          isActive={isActive}
          activeFeedback={activeFeedback}
          handleMiss={handleMiss}
          advanceStream={advanceStream}
          onTimerStateChange={onTimerStateChange}
          Colors={Colors}
        />
      </View>

      {/* Feedback Overlay (Captions, Flashes, floated deltas) */}
      <LighthouseWatchFeedback activeFeedback={activeFeedback} Colors={Colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topZone: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  roundText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption + 1,
    marginTop: Spacing[2],
  },
  streamContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
    height: 160,
  },
});
