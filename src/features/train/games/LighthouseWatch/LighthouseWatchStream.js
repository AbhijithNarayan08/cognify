// src/features/train/games/LighthouseWatch/LighthouseWatchStream.js
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LighthouseWatchIcon from './LighthouseWatchIcon';

/**
 * LighthouseWatchStream manages the timing cycles and sliding animations.
 */
export default function LighthouseWatchStream({
  currentIcon,
  roundPhase,
  setRoundPhase,
  config,
  isActive,
  activeFeedback,
  handleMiss,
  advanceStream,
  onTimerStateChange,
  Colors,
}) {
  const [incoming, setIncoming] = useState(currentIcon);
  const [outgoing, setOutgoing] = useState(null);

  // Animation values
  const entranceAnim = useRef(new Animated.Value(0)).current; // Opacity & scale entry
  const exitAnim = useRef(new Animated.Value(1)).current;     // Outgoing fade opacity
  const shakeAnim = useRef(new Animated.Value(0)).current;    // Miss horizontal shake
  const scaleAnim = useRef(new Animated.Value(1)).current;    // Hit spring scale
  const redFlashAnim = useRef(new Animated.Value(0)).current; // False Alarm red overlay
  const whiteFlashAnim = useRef(new Animated.Value(0)).current; // Hit brightness overlay

  const timeoutsRef = useRef([]);

  // Transition cycle timing machine
  useEffect(() => {
    if (!isActive) {
      clearAllTimers();
      onTimerStateChange?.(false); // Pause clock when app is paused
      return;
    }

    clearAllTimers();

    if (roundPhase === 'stimulus') {
      onTimerStateChange?.(true); // Start session timer when icon displays

      const stimTimeout = setTimeout(() => {
        // Star target exits, check if it was missed
        handleMiss();
        
        // Start fading current out and queue ISI
        setRoundPhase('isi');
        onTimerStateChange?.(false); // Pause timer during ISI dead time
      }, config.stimulusDuration);

      timeoutsRef.current.push(stimTimeout);
    } else {
      // ISI phase
      onTimerStateChange?.(false);

      const isiTimeout = setTimeout(() => {
        advanceStream();
        setRoundPhase('stimulus');
      }, config.ISI);

      timeoutsRef.current.push(isiTimeout);
    }

    return () => clearAllTimers();
  }, [roundPhase, isActive, config, currentIcon]);

  const clearAllTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // Manage incoming/outgoing sliding transitions with 20ms overlap
  useEffect(() => {
    if (currentIcon && roundPhase === 'stimulus') {
      setOutgoing(incoming);
      setIncoming(currentIcon);

      // Entrance animation: slide down (translateY -20 to 0) + fade in (0 to 1) over 100ms
      entranceAnim.setValue(0);
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();

      // Exit animation: fade out over 80ms (with 20ms overlap)
      exitAnim.setValue(1);
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start(() => {
        setOutgoing(null);
      });
    }
  }, [currentIcon, roundPhase]);

  // Layer visual feedbacks (Hits, Misses, False Alarms)
  useEffect(() => {
    if (!activeFeedback) return;

    const { type } = activeFeedback;

    if (type === 'hit') {
      // Scale star 1.0 -> 1.2 -> 1.0 over 200ms (spring)
      scaleAnim.setValue(1);
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.2, tension: 90, friction: 4, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1.0, tension: 90, friction: 4, useNativeDriver: true }),
      ]).start();

      // Brightness overlay pulse (white flash 20% opacity)
      whiteFlashAnim.setValue(0);
      Animated.sequence([
        Animated.timing(whiteFlashAnim, { toValue: 0.25, duration: 100, useNativeDriver: true }),
        Animated.timing(whiteFlashAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }

    if (type === 'miss') {
      // Turn star grey and shake horizontally (translateX ±6pt, 3 oscillations)
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 6, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 90, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
    }

    if (type === 'false_alarm') {
      // Invert distractor briefly (flash red 50% opacity for 150ms)
      redFlashAnim.setValue(0);
      Animated.sequence([
        Animated.timing(redFlashAnim, { toValue: 0.6, duration: 75, useNativeDriver: true }),
        Animated.timing(redFlashAnim, { toValue: 0, duration: 75, useNativeDriver: true }),
      ]).start();
    }

  }, [activeFeedback]);

  // Render outgoing icon fading out
  const renderOutgoing = () => {
    if (!outgoing) return null;

    return (
      <Animated.View style={[styles.iconWrapper, { opacity: exitAnim }]}>
        <LighthouseWatchIcon
          type={outgoing}
          color={outgoing === 'target' ? Colors.domain.attention.main : Colors.textPrimary}
        />
      </Animated.View>
    );
  };

  // Render incoming icon sliding and fading in
  const renderIncoming = () => {
    if (!incoming || roundPhase !== 'stimulus') return null;

    const isTarget = incoming === 'target';
    const isMiss = activeFeedback?.type === 'miss';

    // Color resolves: targets turn grey on Miss
    let iconColor = isTarget
      ? (isMiss ? Colors.textMuted : Colors.domain.attention.main)
      : Colors.textPrimary;

    // Distractor opacities for visual contrast
    if (!isTarget) {
      iconColor = 'rgba(29, 35, 64, 0.45)'; // Sleek muted slate for distractor shapes
    }

    // Entrance translateY slide (-20 to 0)
    const translateY = entranceAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-20, 0],
    });

    const entranceOpacity = entranceAnim;

    return (
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            opacity: entranceOpacity,
            transform: [
              { translateY },
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        <LighthouseWatchIcon type={incoming} color={iconColor} size={48} />

        {/* Dynamic bright white overlay on Hit */}
        <Animated.View style={[styles.flashOverlay, { opacity: whiteFlashAnim, backgroundColor: '#FFFFFF' }]} />

        {/* Dynamic dark red overlay on False Alarm */}
        <Animated.View style={[styles.flashOverlay, { opacity: redFlashAnim, backgroundColor: '#E24B4A' }]} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {renderOutgoing()}
      {renderIncoming()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconWrapper: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    zIndex: 10,
  },
});
