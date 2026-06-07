import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../../theme';
import { t } from '../../../constants/useStrings';

export function SequenceRecallGame({ trialIdx, feedback, onAnswer, Colors }) {
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  
  const [sequence, setSequence] = useState([]);
  const [activeOrb, setActiveOrb] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userClicks, setUserClicks] = useState([]);
  
  const timeouts = useRef([]);

  const orbColors = [
    Colors.domain.memory.main,
    Colors.domain.speed.main,
    Colors.domain.attention.main,
  ];

  // Helper to generate a random sequence
  const startNewRound = (length) => {
    // Clear any active playbacks
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setActiveOrb(null);
    setUserClicks([]);

    const nextSeq = [];
    for (let i = 0; i < length; i++) {
      nextSeq.push(Math.floor(Math.random() * 3));
    }
    setSequence(nextSeq);
    setIsPlaying(true);

    // Sequence playback schedule
    nextSeq.forEach((orbIdx, i) => {
      // Turn on
      const onTimeout = setTimeout(() => {
        setActiveOrb(orbIdx);
      }, i * 700 + 300);
      
      // Turn off
      const offTimeout = setTimeout(() => {
        setActiveOrb(null);
        if (i === nextSeq.length - 1) {
          setIsPlaying(false);
        }
      }, i * 700 + 750);

      timeouts.current.push(onTimeout, offTimeout);
    });
  };

  // Start sequence when round changes
  useEffect(() => {
    const roundLength = 3 + Math.floor(trialIdx / 2);
    startNewRound(roundLength);

    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, [trialIdx]);

  const handleOrbPress = (idx) => {
    if (isPlaying) return;

    const currentStep = userClicks.length;
    const expected = sequence[currentStep];

    if (idx === expected) {
      const nextClicks = [...userClicks, idx];
      setUserClicks(nextClicks);

      // Light up the tapped orb briefly
      setActiveOrb(idx);
      setTimeout(() => setActiveOrb(null), 150);

      // Completed sequence successfully
      if (nextClicks.length === sequence.length) {
        onAnswer(true);
      }
    } else {
      // Mistake made
      setActiveOrb(idx);
      setTimeout(() => {
        setActiveOrb(null);
        onAnswer(false);
      }, 150);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isPlaying ? t('train.sequenceRecall.watchSequence') : t('train.sequenceRecall.repeatPattern')}
      </Text>
      
      <View style={styles.orbsContainer}>
        {orbColors.map((color, idx) => {
          const isLit = activeOrb === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.orb,
                {
                  backgroundColor: color,
                  opacity: isPlaying ? (isLit ? 1.0 : 0.25) : 0.85,
                  transform: [{ scale: isLit ? 1.15 : 1.0 }],
                  borderColor: isLit ? '#FFFFFF' : 'transparent',
                  borderWidth: 3,
                },
                isLit && Shadow.md,
              ]}
              onPress={() => handleOrbPress(idx)}
              activeOpacity={0.7}
              disabled={isPlaying}
            />
          );
        })}
      </View>

      <View style={styles.statusBox}>
        {isPlaying ? (
          <ActivityIndicator size="small" color={Colors.brandPrimary} />
        ) : (
          <Text style={styles.statusText}>
            {t('train.sequenceRecall.tappedProgress', { current: userClicks.length, total: sequence.length })}
          </Text>
        )}
      </View>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: Spacing[6] },
  title: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.body, color: Colors.textSecondary },
  orbsContainer: { flexDirection: 'row', gap: Spacing[6], alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  orb: { width: 80, height: 80, borderRadius: 40 },
  statusBox: { minHeight: 30, justifyContent: 'center' },
  statusText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.caption, color: Colors.textMuted },
});
