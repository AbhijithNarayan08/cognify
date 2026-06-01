// src/shared/components/MascotCharacters.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import Svg, { Path, Ellipse, Circle, Rect } from 'react-native-svg';

/**
 * Helper to initialize and loop breathing (pulse) and swaying animations.
 * Respects Accessibility reduced motion settings.
 */
function useMascotLoops() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    let pulseLoop = null;
    let swayLoop = null;

    const startAnimations = () => {
      // Loop breathing scale (1.0 to 1.08 over 1200ms)
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Loop organic sway (-1 to 1 over 1600ms)
      swayLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: -1,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      swayLoop.start();
    };

    const stopAnimations = () => {
      if (pulseLoop) pulseLoop.stop();
      if (swayLoop) swayLoop.stop();
      pulseAnim.setValue(1);
      swayAnim.setValue(0);
    };

    // Query initial state
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!active) return;
      if (enabled) {
        stopAnimations();
      } else {
        startAnimations();
      }
    });

    // Listen to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (!active) return;
        if (enabled) {
          stopAnimations();
        } else {
          startAnimations();
        }
      }
    );

    return () => {
      active = false;
      stopAnimations();
      subscription.remove();
    };
  }, []);

  return { pulseAnim, swayAnim };
}

/**
 * Mascot 1: Energy Star (Trained / Activity theme)
 * Nested golden stars with a determined happy face.
 */
export function DynamicStar({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  const outerScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.04] });
  const outerScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.02, 0.98] });
  const outerRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });
  const outerTranslateX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-2, 2] });

  const middleScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.03, 0.96] });
  const middleScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.02] });
  const middleRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['3deg', '-3deg'] });

  const innerScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.95, 1.06] });

  const starPath = "M 50 8 C 50 8 58 35 63 38 C 68 41 92 41 92 41 C 92 41 73 56 75 62 C 77 68 83 91 83 91 C 83 91 62 77 50 83 C 38 77 17 91 17 91 C 17 91 23 68 25 62 C 27 56 8 41 8 41 C 8 41 32 41 37 38 C 42 35 50 8 50 8 Z";

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Layer: Amber/Gold */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: outerScaleX }, { scaleY: outerScaleY }, { translateX: outerTranslateX }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d={starPath} fill="#FFC000" />
        </Svg>
      </Animated.View>

      {/* Middle Layer: Coral */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: middleScaleX }, { scaleY: middleScaleY }, { rotate: middleRotate }] }]}>
        <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 100 100">
          <Path d={starPath} fill="#FF5E5B" />
        </Svg>
      </Animated.View>

      {/* Inner Layer: Core with Face */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleY: innerScaleY }] }]}>
        <Svg width={size * 0.52} height={size * 0.52} viewBox="0 0 100 100">
          <Path d={starPath} fill="#FFF9E6" />
          {/* Eyes */}
          <Circle cx="40" cy="52" r="3.5" fill="#1A1816" />
          <Circle cx="60" cy="52" r="3.5" fill="#1A1816" />
          {/* Blush */}
          <Ellipse cx="33" cy="59" rx="4" ry="2" fill="#FF5E5B" opacity="0.6" />
          <Ellipse cx="67" cy="59" rx="4" ry="2" fill="#FF5E5B" opacity="0.6" />
          {/* Smile */}
          <Path d="M 46 62 Q 50 67 54 62" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Mascot 2: Sleepy Moon (Sleep / Rest theme)
 * Nested peaceful crescent moons in blue/cream.
 */
export function DynamicMoon({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  const outerScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.98, 1.03] });
  const outerRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const outerTranslateX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-1.5, 1.5] });

  const middleScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.02, 0.97] });
  const middleRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['2deg', '-2deg'] });

  const innerScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.96, 1.05] });

  const moonPath = "M 75 15 C 40 15 15 40 15 75 C 15 100 35 115 50 115 C 32 100 25 80 25 60 C 25 40 40 25 65 20 C 70 18 73 16 75 15 Z";

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Layer: Deep Blue */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: outerScale }, { translateX: outerTranslateX }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 120">
          <Path d={moonPath} fill="#0073E6" />
        </Svg>
      </Animated.View>

      {/* Middle Layer: Sky Blue */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: middleScale }, { rotate: middleRotate }] }]}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 120">
          <Path d={moonPath} fill="#6CA4F4" />
        </Svg>
      </Animated.View>

      {/* Inner Layer: Core with Face */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: innerScale }] }]}>
        <Svg width={size * 0.54} height={size * 0.54} viewBox="0 0 100 120">
          <Path d={moonPath} fill="#FFF9E6" />
          {/* Sleeping Eyes Left */}
          <Path d="M 38 68 Q 41 64 44 68" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Sleeping Eyes Right */}
          <Path d="M 52 68 Q 55 64 58 68" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Blush */}
          <Ellipse cx="33" cy="74" rx="3.5" ry="1.8" fill="#FF5E5B" opacity="0.55" />
          <Ellipse cx="63" cy="74" rx="3.5" ry="1.8" fill="#FF5E5B" opacity="0.55" />
          {/* Calm Resting mouth */}
          <Circle cx="48" cy="76" r="2.5" fill="#1A1816" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Mascot 3: Smart Brain (Insights / Intelligence theme)
 * Nested brain-clouds in green/purple.
 */
export function DynamicBrain({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  const outerScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.96, 1.05] });
  const outerScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.03, 0.97] });
  const outerRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-2.5deg', '2.5deg'] });
  const outerTranslateX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-1, 1] });

  const middleScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.02, 0.95] });
  const middleScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.03] });

  const innerScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.94, 1.06] });

  const brainPath = "M 50 95 C 28 95 12 85 12 60 C 12 42 25 32 45 32 C 48 20 62 12 75 18 C 88 24 95 38 95 55 C 95 78 78 95 50 95 Z";

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Layer: Pastel Green */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: outerScaleX }, { scaleY: outerScaleY }, { translateX: outerTranslateX }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d={brainPath} fill="#3DAB7F" />
        </Svg>
      </Animated.View>

      {/* Middle Layer: Lavender Purple */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: middleScaleX }, { scaleY: middleScaleY }] }]}>
        <Svg width={size * 0.76} height={size * 0.76} viewBox="0 0 100 100">
          <Path d={brainPath} fill="#A662C6" />
        </Svg>
      </Animated.View>

      {/* Inner Layer: Core with Face */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: innerScale }] }]}>
        <Svg width={size * 0.52} height={size * 0.52} viewBox="0 0 100 100">
          <Path d={brainPath} fill="#FFF9E6" />
          {/* Smart Winking Eye Left (Wink) */}
          <Path d="M 36 55 C 38 52 42 52 44 55" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Winking Eye Right (Open) */}
          <Circle cx="60" cy="53" r="3.2" fill="#1A1816" />
          {/* Blush */}
          <Ellipse cx="33" cy="62" rx="3.5" ry="1.8" fill="#FF5E5B" opacity="0.6" />
          <Ellipse cx="66" cy="62" rx="3.5" ry="1.8" fill="#FF5E5B" opacity="0.6" />
          {/* Smile */}
          <Path d="M 44 65 Q 49 69 54 65" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Mascot 4: Happy Sun (Mood theme)
 * Nested warm sun circles in pink/gold.
 */
export function DynamicSun({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  const outerScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.05] });
  const outerScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.02, 0.97] });
  const outerRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-3.5deg', '3.5deg'] });

  const middleScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.03, 0.94] });
  const middleScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.96, 1.03] });

  const innerScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.93, 1.07] });

  const sunPath = "M 50 95 C 25 95 5 75 5 50 C 5 25 25 5 50 5 C 75 5 95 25 95 50 C 95 75 75 95 50 95 Z";

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Layer: Pink */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: outerScaleX }, { scaleY: outerScaleY }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d={sunPath} fill="#FF7DB4" />
        </Svg>
      </Animated.View>

      {/* Middle Layer: Yellow */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: middleScaleX }, { scaleY: middleScaleY }] }]}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 100">
          <Path d={sunPath} fill="#FFC000" />
        </Svg>
      </Animated.View>

      {/* Inner Layer: Core with Face */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: innerScale }] }]}>
        <Svg width={size * 0.54} height={size * 0.54} viewBox="0 0 100 100">
          <Path d={sunPath} fill="#FFF9E6" />
          {/* Playful smiling curved eyes */}
          <Path d="M 36 48 Q 40 51 44 48" stroke="#1A1816" strokeWidth="3" strokeLinecap="round" fill="none" />
          <Path d="M 56 48 Q 60 51 64 48" stroke="#1A1816" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Blush */}
          <Ellipse cx="33" cy="55" rx="4" ry="2" fill="#FF5E5B" opacity="0.65" />
          <Ellipse cx="67" cy="55" rx="4" ry="2" fill="#FF5E5B" opacity="0.65" />
          {/* Wide Happy Smile */}
          <Circle cx="50" cy="57" r="3.5" fill="#1A1816" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Mascot 5: Chain Link (Signal Chain / Working Memory theme)
 * Nested connected nodes in blue/cream with cute nerdy glasses.
 */
export function DynamicChainLink({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  const outerScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.04] });
  const outerScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.02, 0.98] });
  const outerRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });
  const outerTranslateX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-2, 2] });

  const middleScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.03, 0.96] });
  const middleScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.02] });
  const middleRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['3deg', '-3deg'] });

  const innerScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.95, 1.05] });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Layer: Memory Blue Chain */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: outerScaleX }, { scaleY: outerScaleY }, { translateX: outerTranslateX }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Left Node */}
          <Circle cx="20" cy="50" r="15" fill="#0073E6" />
          {/* Connecting Bar */}
          <Rect x="20" y="43" width="60" height="14" rx="7" fill="#0073E6" />
          {/* Right Node */}
          <Circle cx="80" cy="50" r="15" fill="#0073E6" />
          {/* Center main Node */}
          <Circle cx="50" cy="50" r="28" fill="#0073E6" />
        </Svg>
      </Animated.View>

      {/* Middle Layer: Sky Blue Chain */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: middleScaleX }, { scaleY: middleScaleY }, { rotate: middleRotate }] }]}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 100">
          {/* Left Node */}
          <Circle cx="20" cy="50" r="15" fill="#6CA4F4" />
          {/* Connecting Bar */}
          <Rect x="20" y="43" width="60" height="14" rx="7" fill="#6CA4F4" />
          {/* Right Node */}
          <Circle cx="80" cy="50" r="15" fill="#6CA4F4" />
          {/* Center main Node */}
          <Circle cx="50" cy="50" r="28" fill="#6CA4F4" />
        </Svg>
      </Animated.View>

      {/* Inner Layer: Core with Face */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: innerScale }] }]}>
        <Svg width={size * 0.54} height={size * 0.54} viewBox="0 0 100 100">
          {/* Center cream core */}
          <Circle cx="50" cy="50" r="28" fill="#FFF9E6" />
          
          {/* Adorable glasses */}
          <Circle cx="39" cy="48" r="9" stroke="#1A1816" strokeWidth="2.5" fill="none" />
          <Circle cx="61" cy="48" r="9" stroke="#1A1816" strokeWidth="2.5" fill="none" />
          <Path d="M 48 48 Q 50 45 52 48" stroke="#1A1816" strokeWidth="2.5" fill="none" />
          
          {/* Smiling eyes inside glasses */}
          <Path d="M 35 48 Q 39 51 43 48" stroke="#1A1816" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <Path d="M 57 48 Q 61 51 65 48" stroke="#1A1816" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          
          {/* Blush */}
          <Ellipse cx="29" cy="55" rx="3.5" ry="1.8" fill="#FF5E5B" opacity="0.6" />
          <Ellipse cx="71" cy="55" rx="3.5" ry="1.8" fill="#FF5E5B" opacity="0.6" />
          
          {/* Smile */}
          <Path d="M 45 57 Q 50 62 55 57" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Mascot 6: Speedy Spark (Flash Sort / Processing Speed theme)
 * A gorgeous multi-layered horizontal lightning bolt character with a determined winking face,
 * styled after a classic geometric vertical thunderbolt rotated horizontally.
 */
export function DynamicFlash({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  const outerScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.96, 1.05] });
  const outerScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.03, 0.97] });
  const outerRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-3.5deg', '3.5deg'] });
  const outerTranslateX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-1.5, 1.5] });

  const middleScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.02, 0.95] });
  const middleScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.03] });

  const innerScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.94, 1.06] });

  // Aerodynamically balanced rotated horizontal lightning bolt path
  const boltPath = "M 20 30 L 65 30 L 48 50 L 80 50 L 95 60 L 40 75 L 48 58 L 20 58 Z";

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Layer: Gold Horizontal Lightning Bolt */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: outerScaleX }, { scaleY: outerScaleY }, { translateX: outerTranslateX }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d={boltPath} fill="#FFC000" />
        </Svg>
      </Animated.View>

      {/* Middle Layer: Coral Horizontal Lightning Bolt */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: middleScaleX }, { scaleY: middleScaleY }] }]}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 100">
          <Path d={boltPath} fill="#FF5E5B" />
        </Svg>
      </Animated.View>

      {/* Inner Layer: Cream Core with determined face */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: innerScale }] }]}>
        <Svg width={size * 0.54} height={size * 0.54} viewBox="0 0 100 100">
          <Path d={boltPath} fill="#FFF9E6" />
          
          {/* Face Elements Centered on main body */}
          {/* Left Eye: open Circle */}
          <Circle cx="42" cy="48" r="3.2" fill="#1A1816" />
          {/* Right Eye: winking curved line */}
          <Path d="M 52 48 Q 56 51 60 48" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          
          {/* Blush */}
          <Ellipse cx="36" cy="54" rx="3.2" ry="1.6" fill="#FF5E5B" opacity="0.6" />
          <Ellipse cx="62" cy="54" rx="3.2" ry="1.6" fill="#FF5E5B" opacity="0.6" />
          
          {/* Determined Smile */}
          <Path d="M 44 56 Q 48 60 52 56" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Mascot 7: Glowing Lighthouse (Lighthouse Watch / Sustained Attention theme)
 * A charming vertical lighthouse designed with official green attention domain colors,
 * featuring glowing light-green holographic searchlight beams and a friendly face.
 */
export function DynamicLighthouse({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  const outerScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.96, 1.05] });
  const outerScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.03, 0.97] });
  const outerRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });
  const outerTranslateX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-1, 1] });

  const middleScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.02, 0.95] });
  const middleScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.03] });

  const innerScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.94, 1.06] });

  const towerPath = "M 34 90 L 42 42 H 36 V 38 H 64 V 42 H 58 L 66 90 Z";
  const capPath = "M 42 38 H 58 V 26 Q 50 12 42 26 Z";

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Light Beams (Outer Layer Backing) */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: outerScaleX }, { translateX: outerTranslateX }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Green Holographic Beams */}
          <Path d="M 42 26 L 5 10 L 5 45 Z" fill="#5CD6A3" opacity="0.45" />
          <Path d="M 58 26 L 95 10 L 95 45 Z" fill="#5CD6A3" opacity="0.45" />
        </Svg>
      </Animated.View>

      {/* Outer Layer: Attention Main Green Lighthouse */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: outerScaleX }, { scaleY: outerScaleY }, { translateX: outerTranslateX }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d={towerPath} fill="#3DAB7F" />
          <Path d={capPath} fill="#3DAB7F" />
        </Svg>
      </Animated.View>

      {/* Middle Layer: Deep Attention Green Lighthouse */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: middleScaleX }, { scaleY: middleScaleY }] }]}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 100">
          <Path d={towerPath} fill="#0F3323" />
          <Path d={capPath} fill="#0F3323" />
        </Svg>
      </Animated.View>

      {/* Inner Layer: Light Attention Green Core with Adorable Face */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: innerScale }] }]}>
        <Svg width={size * 0.54} height={size * 0.54} viewBox="0 0 100 100">
          <Path d={towerPath} fill="#E6F5EE" />
          <Path d={capPath} fill="#E6F5EE" />
          
          {/* Tower window detail */}
          <Rect x="47" y="48" width="6" height="10" rx="3" fill="#3DAB7F" />
          
          {/* Light Beams Inner Core (little shining glow inside the lantern room!) */}
          <Circle cx="50" cy="28" r="7" fill="#5CD6A3" />
          
          {/* Cute Face on Tower Body */}
          <Circle cx="44" cy="62" r="3.2" fill="#0F3323" />
          <Circle cx="56" cy="62" r="3.2" fill="#0F3323" />
          
          {/* Green Blush */}
          <Ellipse cx="37" cy="68" rx="3.2" ry="1.6" fill="#5CD6A3" opacity="0.5" />
          <Ellipse cx="63" cy="68" rx="3.2" ry="1.6" fill="#5CD6A3" opacity="0.5" />
          
          {/* Happy Smile */}
          <Path d="M 47 69 Q 50 73 53 69" stroke="#0F3323" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Mascot 8: Clever Woven Yarn Sphere (Word Weave / Verbal Reasoning theme)
 * A gorgeous animated woven yarn ball in official orange verbal domain colors,
 * featuring nerdy glasses, woven letters 'A' and 'B', and a cheerful smart face.
 */
export function DynamicWordWeave({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  const outerScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.04] });
  const outerScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.02, 0.98] });
  const outerRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });
  const outerTranslateX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-2, 2] });

  const middleScaleY = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [1.03, 0.96] });
  const middleScaleX = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.97, 1.02] });
  const middleRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['3deg', '-3deg'] });

  const innerScale = pulseAnim.interpolate({ inputRange: [1, 1.08], outputRange: [0.95, 1.05] });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer Layer: Verbal Main Orange Yarn Sphere */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: outerScaleX }, { scaleY: outerScaleY }, { translateX: outerTranslateX }, { rotate: outerRotate }] }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="42" fill="#FF7A00" />
        </Svg>
      </Animated.View>

      {/* Middle Layer: Warm Amber/Gold Yarn Sphere */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scaleX: middleScaleX }, { scaleY: middleScaleY }, { rotate: middleRotate }] }]}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="42" fill="#FFC000" />
        </Svg>
      </Animated.View>

      {/* Inner Layer: Light Verbal Peach-Cream Core with Face and Woven Details */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, { transform: [{ scale: innerScale }] }]}>
        <Svg width={size * 0.54} height={size * 0.54} viewBox="0 0 100 100">
          {/* Inner peach-cream sphere core */}
          <Circle cx="50" cy="50" r="42" fill="#FFF0E6" />
          
          {/* Elegantly woven yarn thread paths overlapping to create a gorgeous "Word Weave" texture */}
          <Path d="M 20 25 Q 55 50 20 75" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
          <Path d="M 80 25 Q 45 50 80 75" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
          <Path d="M 25 20 Q 50 55 75 20" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
          <Path d="M 25 80 Q 50 45 75 80" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
          
          {/* Subtly woven letter glyphs inside the yarn threads for verbal/reading theme */}
          <Path d="M 22 36 L 25 30 L 28 36 M 23 34 H 27" stroke="#FF7A00" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
          <Path d="M 72 30 H 75 Q 78 30 78 33 Q 78 36 75 36 H 72 M 72 36 H 75 Q 78 36 78 39 Q 78 42 75 42 H 72 M 72 30 V 42" stroke="#FF7A00" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />

          {/* Super cute nerdy glasses representing intelligent verbal reasoning */}
          <Circle cx="39" cy="48" r="9" stroke="#1A1816" strokeWidth="2.5" fill="none" />
          <Circle cx="61" cy="48" r="9" stroke="#1A1816" strokeWidth="2.5" fill="none" />
          <Path d="M 48 48 Q 50 45 52 48" stroke="#1A1816" strokeWidth="2.5" fill="none" />

          {/* Happy winking eyes inside glasses */}
          <Path d="M 35 48 Q 39 51 43 48" stroke="#1A1816" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <Path d="M 57 48 Q 61 45 65 48" stroke="#1A1816" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Blush */}
          <Ellipse cx="29" cy="56" rx="3.5" ry="1.8" fill="#FF5E5B" opacity="0.65" />
          <Ellipse cx="71" cy="56" rx="3.5" ry="1.8" fill="#FF5E5B" opacity="0.65" />

          {/* Cheerful wide smart smile */}
          <Path d="M 45 58 Q 50 63 55 58" stroke="#1A1816" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Mascot 9: Dynamic Flame (Streak / Gamification theme)
 * A gorgeous multi-layered SVG flame mascot character with vertical breathing
 * pulse and horizontal swaying loops, carrying an adorable smiling face.
 */
export function DynamicFlame({ size = 112 }) {
  const { pulseAnim, swayAnim } = useMascotLoops();

  // Outer layer animations
  const outerScaleY = pulseAnim.interpolate({
    inputRange: [1, 1.08],
    outputRange: [0.97, 1.05],
  });
  const outerScaleX = pulseAnim.interpolate({
    inputRange: [1, 1.08],
    outputRange: [1.02, 0.97],
  });
  const outerRotate = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });
  const outerTranslateX = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-3, 3],
  });

  // Middle layer animations
  const middleScaleY = pulseAnim.interpolate({
    inputRange: [1, 1.08],
    outputRange: [1.04, 0.94], // out of phase
  });
  const middleScaleX = pulseAnim.interpolate({
    inputRange: [1, 1.08],
    outputRange: [0.96, 1.03],
  });
  const middleRotate = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['4deg', '-4deg'], // opposite sway
  });
  const middleTranslateX = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [2, -2],
  });

  // Inner core animations
  const innerScaleY = pulseAnim.interpolate({
    inputRange: [1, 1.08],
    outputRange: [0.93, 1.09],
  });
  const innerRotate = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });
  const innerTranslateX = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-1, 1],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Layer 1: Outer Flame (Coral #FF5E5B) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.center,
          {
            transform: [
              { scaleX: outerScaleX },
              { scaleY: outerScaleY },
              { translateX: outerTranslateX },
              { rotate: outerRotate },
            ],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 120">
          <Path
            d="M 50 110 C 20 110 5 90 5 60 C 5 30 35 15 50 5 C 65 15 95 30 95 60 C 95 90 80 110 50 110 Z"
            fill="#FF5E5B"
          />
        </Svg>
      </Animated.View>

      {/* Layer 2: Middle Flame (Amber/Gold #FFC000) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.center,
          {
            transform: [
              { scaleX: middleScaleX },
              { scaleY: middleScaleY },
              { translateX: middleTranslateX },
              { rotate: middleRotate },
            ],
          },
        ]}
      >
        <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 120">
          <Path
            d="M 50 100 C 25 100 15 85 15 60 C 15 35 35 25 50 15 C 65 25 85 35 85 60 C 85 85 75 100 50 100 Z"
            fill="#FFC000"
          />
        </Svg>
      </Animated.View>

      {/* Layer 3: Inner Flame Core (Cream surface #FFF9E6) with Playful Face */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.center,
          {
            transform: [
              { scaleY: innerScaleY },
              { translateX: innerTranslateX },
              { rotate: innerRotate },
            ],
          },
        ]}
      >
        <Svg width={size * 0.54} height={size * 0.54} viewBox="0 0 100 120">
          <Path
            d="M 50 90 C 32 90 25 80 25 60 C 25 45 40 38 50 30 C 60 38 75 45 75 60 C 75 80 68 90 50 90 Z"
            fill="#FFF9E6"
          />
          {/* Smiling Eye Left */}
          <Path
            d="M 38 64 Q 42 67 46 64"
            stroke="#1A1816"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Smiling Eye Right */}
          <Path
            d="M 54 64 Q 58 67 62 64"
            stroke="#1A1816"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Playful Pink Cheeks */}
          <Ellipse cx="34" cy="69" rx="4.5" ry="2.2" fill="#FF5E5B" opacity="0.65" />
          <Ellipse cx="66" cy="69" rx="4.5" ry="2.2" fill="#FF5E5B" opacity="0.65" />
          
          {/* Happy Gasping Mouth */}
          <Circle cx="50" cy="72" r="4" fill="#1A1816" />
        </Svg>
      </Animated.View>
    </View>
  );
}




const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
