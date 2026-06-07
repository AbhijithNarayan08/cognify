import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, PanResponder
} from 'react-native';
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';
import { X, Sliders } from 'lucide-react-native';
import { useThemeColors, Typography, Radius, Spacing, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';
import { GameHaptics } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TRACK_WIDTH = 260;
const THUMB_SIZE = 28;

const CHECKIN_LABELS = {
  sleep: ['terrible', 'poor', 'ok', 'good', 'great'],
  activity: ['rest', 'walk', 'run', 'gym', 'sport'],
  mood: ['terrible', 'poor', 'ok', 'good', 'great'],
};

export function CheckinBottomSheet({
  visible,
  type,
  initialValue = 2,
  onClose,
  onComplete,
  Colors,
}) {
  const activeColors = Colors || useThemeColors();
  const styles = useMemo(() => getStyles(activeColors), [activeColors]);

  // sliderVal is a float (0 to 4) during active dragging for buttery-smooth animations
  const [sliderVal, setSliderVal] = useState(initialValue);
  const activeIntVal = Math.round(sliderVal);

  // Sync initial rating focus when sheet opens
  useEffect(() => {
    if (visible) {
      setSliderVal(initialValue);
    }
  }, [visible, initialValue]);

  // Bottom Sheet Slide-Up Animations
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Looping animation for drifting Zzzs
  const loopAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim;
    if (visible && type === 'sleep') {
      anim = Animated.loop(
        Animated.timing(loopAnim, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        })
      );
      anim.start();
    } else {
      loopAnim.setValue(0);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [visible, type]);

  useEffect(() => {
    if (visible) {
      // Slide up bottom sheet and fade in background overlay
      Animated.parallel([
        Animated.spring(sheetY, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(sheetY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Dismiss overlay action safely
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Dispatch final complete to session slice
  const handleSubmit = () => {
    GameHaptics.correct();
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete(activeIntVal);
    });
  };

  // ── 1. Dynamic Background Color Interpolator (0 to 4 float) ──────────────────
  const dynamicBgColor = useMemo(() => {
    const v = sliderVal;
    if (v <= 2) {
      // Sadness (0 to 2): Interpolate between soft Memory-Blue rgb(188, 212, 255) and neutral linen rgb(240, 238, 232)
      const ratio = v / 2;
      const r = Math.round(188 + (240 - 188) * ratio);
      const g = Math.round(212 + (238 - 212) * ratio);
      const b = Math.round(255 + (232 - 255) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Happiness (2 to 4): Interpolate between neutral linen rgb(240, 238, 232) and soft Coral rgb(244, 166, 154)
      const ratio = (v - 2) / 2;
      const r = Math.round(240 + (244 - 240) * ratio);
      const g = Math.round(238 + (166 - 238) * ratio);
      const b = Math.round(232 + (154 - 232) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }, [sliderVal]);

  // ── 2. Procedural Dynamic Face Math (0 to 4 float) ──────────────────────────
  const faceData = useMemo(() => {
    const v = sliderVal;
    // Eyes: scale size dynamically (Terrible: 0.85x, Okay: 1.0x, Great: 1.08x)
    let eyeScaleY = 11;
    let eyeScaleX = 9;
    let pupilRadius = 5.5;

    if (v <= 2) {
      const ratio = v / 2;
      eyeScaleY = 8.5 + (11 - 8.5) * ratio;
      eyeScaleX = 7.5 + (9 - 7.5) * ratio;
      pupilRadius = 4.2 + (5.5 - 4.2) * ratio;
    } else {
      const ratio = (v - 2) / 2;
      eyeScaleY = 11 + (12 - 11) * ratio;
      eyeScaleX = 9 + (9.8 - 9) * ratio;
      pupilRadius = 5.5 + (6.0 - 5.5) * ratio;
    }

    // Mouth Bezier Path: Starts flat at 52, bends down for frown, up for smile
    const startY = 52 - Math.max(0, v - 2) * 1.5;
    const controlY = 34 + 9 * v;
    const mouthPath = `M 33 ${startY} Q 50 ${controlY} 67 ${startY}`;

    // Sleep closed eyelids bezier control point bending based on rating v
    const eyelidControlY = 28 + v * 4;
    const leftEyePath = `M 30 36 Q 38 ${eyelidControlY} 46 36`;
    const rightEyePath = `M 54 36 Q 62 ${eyelidControlY} 70 36`;

    // Concentric glowing night halo opacity scales with sleep quality
    const haloOpacity = 0.05 + (v / 4) * 0.4;

    return {
      eyeScaleX,
      eyeScaleY,
      pupilRadius,
      mouthPath,
      leftEyePath,
      rightEyePath,
      haloOpacity,
    };
  }, [sliderVal]);

  // ── 2.5 Procedural Dynamic Wave Math for Activity (0 to 4 float) ──────────────
  const waveData = useMemo(() => {
    const v = sliderVal;
    const points = [];
    const steps = 40;
    const startX = 10;
    const endX = 90;
    const w = endX - startX;

    const amplitude = (v / 4) * 28;
    const frequency = 1.5 + (v / 4) * 5.5; // smoothly scales frequency from 1.5 to 7.0 cycles

    for (let i = 0; i <= steps; i++) {
      const pct = i / steps;
      const x = startX + pct * w;
      const envelope = Math.sin(pct * Math.PI); // keeps ends flat at Y = 40
      const y = 40 - Math.sin(pct * Math.PI * frequency) * amplitude * envelope;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return "M " + points.join(" L ");
  }, [sliderVal]);

  // ── 3. Custom Gesture Slider Handler ────────────────────────────────────────
  const sliderRef = useRef(null);
  const handleTouch = (evt) => {
    const x = evt.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / TRACK_WIDTH));
    const val = pct * 4;
    setSliderVal(val);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt);
      },
      onPanResponderRelease: () => {
        // Snap to nearest integer on release
        setSliderVal((prev) => {
          const snapped = Math.round(prev);
          GameHaptics.correct(); // tactile tick on snap
          return snapped;
        });
      },
    })
  ).current;

  // Active state text resolving
  const labelKeys = CHECKIN_LABELS[type] || CHECKIN_LABELS.mood;
  const activeLabel = labelKeys[activeIntVal] || 'ok';
  
  // Custom localized title prefixes matching the screenshots
  const getHeaderTitle = () => {
    if (type === 'mood') return t('home.checkin.mood.prompt');
    if (type === 'sleep') return t('home.checkin.sleep.prompt');
    if (type === 'activity') return t('home.checkin.activity.prompt');
    return t(`home.checkin.${type}.title`) || t('home.checkin.mood.prompt');
  };

  const bubbleLeft = (sliderVal / 4) * TRACK_WIDTH;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Semi-transparent Tap-to-Dismiss Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.55],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Dynamic Sliding Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: dynamicBgColor,
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          {/* Top Exit Row */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
            <X size={20} color="#2E2D2B" />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Header Title */}
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>

            {/* Procedural Emoji Vector Face / Energy Wave Area */}
            <View style={styles.faceContainer}>
              {type === 'activity' ? (
                <Svg width={180} height={110} viewBox="0 0 100 80">
                  {/* Glowing Backing Line */}
                  <Path
                    d={waveData}
                    fill="none"
                    stroke="rgba(46, 45, 43, 0.12)"
                    strokeWidth={11}
                    strokeLinecap="round"
                  />
                  {/* Primary Sharp Line */}
                  <Path
                    d={waveData}
                    fill="none"
                    stroke="#2E2D2B"
                    strokeWidth={5.5}
                    strokeLinecap="round"
                  />
                </Svg>
              ) : (
                <Svg width={140} height={110} viewBox="0 0 100 80">
                  {type === 'sleep' && (
                    <>
                      {/* Layered Golden Concentric Night Halos */}
                      <Circle
                        cx={50}
                        cy={45}
                        r={48}
                        fill="#FFD700"
                        opacity={faceData.haloOpacity * 0.3}
                      />
                      <Circle
                        cx={50}
                        cy={45}
                        r={38}
                        fill="#FFD700"
                        opacity={faceData.haloOpacity * 0.6}
                      />
                      <Circle
                        cx={50}
                        cy={45}
                        r={25}
                        fill="#FFD700"
                        opacity={faceData.haloOpacity * 1.2}
                      />
                    </>
                  )}

                  {type === 'sleep' ? (
                    <>
                      {/* Left Closed Curved Eyelid */}
                      <Path
                        d={faceData.leftEyePath}
                        fill="none"
                        stroke="#2E2D2B"
                        strokeWidth={5}
                        strokeLinecap="round"
                      />
                      {/* Right Closed Curved Eyelid */}
                      <Path
                        d={faceData.rightEyePath}
                        fill="none"
                        stroke="#2E2D2B"
                        strokeWidth={5}
                        strokeLinecap="round"
                      />
                    </>
                  ) : (
                    <>
                      {/* Left Eye */}
                      <Ellipse
                        cx={39}
                        cy={35}
                        rx={faceData.eyeScaleX}
                        ry={faceData.eyeScaleY}
                        fill="#FFFFFF"
                      />
                      <Circle
                        cx={39}
                        cy={35}
                        r={faceData.pupilRadius}
                        fill="#2E2D2B"
                      />

                      {/* Right Eye */}
                      <Ellipse
                        cx={61}
                        cy={35}
                        rx={faceData.eyeScaleX}
                        ry={faceData.eyeScaleY}
                        fill="#FFFFFF"
                      />
                      <Circle
                        cx={61}
                        cy={35}
                        r={faceData.pupilRadius}
                        fill="#2E2D2B"
                      />
                    </>
                  )}

                  {/* Morphing Bezier Mouth */}
                  <Path
                    d={faceData.mouthPath}
                    fill="none"
                    stroke="#2E2D2B"
                    strokeWidth={6.2}
                    strokeLinecap="round"
                  />
                </Svg>
              )}

              {/* Drifting Zzzs absolute overlay for sleep check-in */}
              {type === 'sleep' && (
                <Animated.View
                  style={[
                    styles.zzzsContainer,
                    {
                      opacity: 0.1 + (sliderVal / 4) * 0.9,
                    },
                  ]}
                  pointerEvents="none"
                >
                  {/* Large Z */}
                  <Animated.Text
                    style={[
                      styles.zzzText,
                      styles.zzzTextLarge,
                      {
                        opacity: loopAnim.interpolate({
                          inputRange: [0, 0.15, 0.6, 0.8],
                          outputRange: [0, 0.85, 0.85, 0],
                          extrapolate: 'clamp',
                        }),
                        transform: [
                          {
                            translateY: loopAnim.interpolate({
                              inputRange: [0, 0.8],
                              outputRange: [15, -45],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateX: loopAnim.interpolate({
                              inputRange: [0, 0.8],
                              outputRange: [5, 20],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    Z
                  </Animated.Text>

                  {/* Medium z */}
                  <Animated.Text
                    style={[
                      styles.zzzText,
                      styles.zzzTextMedium,
                      {
                        opacity: loopAnim.interpolate({
                          inputRange: [0, 0.2, 0.35, 0.75, 0.9],
                          outputRange: [0, 0, 0.85, 0.85, 0],
                          extrapolate: 'clamp',
                        }),
                        transform: [
                          {
                            translateY: loopAnim.interpolate({
                              inputRange: [0, 0.2, 0.9],
                              outputRange: [15, 15, -40],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateX: loopAnim.interpolate({
                              inputRange: [0, 0.2, 0.9],
                              outputRange: [0, 0, 25],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    z
                  </Animated.Text>

                  {/* Small z */}
                  <Animated.Text
                    style={[
                      styles.zzzText,
                      styles.zzzTextSmall,
                      {
                        opacity: loopAnim.interpolate({
                          inputRange: [0, 0.45, 0.6, 0.85, 1],
                          outputRange: [0, 0, 0.75, 0.75, 0],
                          extrapolate: 'clamp',
                        }),
                        transform: [
                          {
                            translateY: loopAnim.interpolate({
                              inputRange: [0, 0.45, 1],
                              outputRange: [15, 15, -35],
                              extrapolate: 'clamp',
                            }),
                          },
                          {
                            translateX: loopAnim.interpolate({
                              inputRange: [0, 0.45, 1],
                              outputRange: [-5, -5, 30],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    z
                  </Animated.Text>
                </Animated.View>
              )}
            </View>

            {/* Custom Styled Slider Container */}
            <View style={styles.sliderContainer}>
              {/* Tooltip Bubble (Fitted above the active thumb knob) */}
              <View
                style={[
                  styles.bubbleWrapper,
                  {
                    left: bubbleLeft,
                  },
                ]}
              >
                <View style={[styles.bubbleCard, Shadow.sm]}>
                  <Text style={styles.bubbleText}>
                    {t('home.checkin.option.' + activeLabel) || activeLabel}
                  </Text>
                </View>
                <View style={styles.bubbleCaret} />
              </View>

              {/* Slider Track with Gesture Responder */}
              <View
                ref={sliderRef}
                style={styles.sliderTrack}
                {...panResponder.panHandlers}
                pointerEvents="box-only"
              >
                {/* Inactive Track Line */}
                <View style={[styles.sliderTrackLine, { backgroundColor: 'rgba(0,0,0,0.08)' }]} />
                
                {/* Active Thumb Knob */}
                <View
                  style={[
                    styles.sliderThumb,
                    Shadow.sm,
                    {
                      left: (sliderVal / 4) * TRACK_WIDTH - THUMB_SIZE / 2,
                    },
                  ]}
                />
              </View>

              {/* Track Left/Right Bound Labels */}
              <View style={styles.boundLabelsRow}>
                <Text style={styles.boundLabel}>{t('home.checkin.bottomSheet.bad')}</Text>
                <Text style={styles.boundLabel}>{t('home.checkin.bottomSheet.great')}</Text>
              </View>
            </View>



            {/* Primary Pill Done/Next CTA Button */}
            <TouchableOpacity
              style={[styles.nextBtn, Shadow.md]}
              onPress={handleSubmit}
              activeOpacity={0.9}
            >
              <Text style={styles.nextBtnText}>{t('home.checkin.bottomSheet.next')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: Radius.xl * 1.5,
    borderTopRightRadius: Radius.xl * 1.5,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8] + 16,
    paddingHorizontal: Spacing[6],
    alignItems: 'center',
    ...Shadow.lg,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing[5],
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 22,
    color: '#2E2D2B',
    textAlign: 'center',
    marginTop: Spacing[2],
  },
  faceContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[2],
    position: 'relative',
  },
  sliderContainer: {
    width: TRACK_WIDTH,
    height: 110,
    justifyContent: 'flex-end',
    position: 'relative',
    marginVertical: Spacing[2],
  },
  bubbleWrapper: {
    position: 'absolute',
    top: 0,
    width: 80,
    marginLeft: -40,
    alignItems: 'center',
  },
  bubbleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: '#2E2D2B',
  },
  bubbleCaret: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
    borderTopColor: '#FFFFFF',
    marginTop: -1,
  },
  sliderTrack: {
    width: TRACK_WIDTH,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackLine: {
    width: '100%',
    height: 10,
    borderRadius: 5,
  },
  sliderThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
  boundLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing[1],
    paddingHorizontal: Spacing[1],
  },
  boundLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: 'rgba(46, 45, 43, 0.6)',
  },

  nextBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[3],
  },
  nextBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: '#1A1816',
  },

  /* Drifting Zzzs overlay styling */
  zzzsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zzzText: {
    fontFamily: Typography.fontFamily.bold,
    color: '#2E2D2B',
    position: 'absolute',
  },
  zzzTextLarge: {
    fontSize: 22,
  },
  zzzTextMedium: {
    fontSize: 17,
  },
  zzzTextSmall: {
    fontSize: 12,
  },
});
