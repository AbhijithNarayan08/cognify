import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, AccessibilityInfo, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Spacing, Radius, Typography } from '../../theme';
import { TouchableScale } from '../../components/Motion';
import LoginForm from './LoginForm';
import { useApp } from '../../context/AppContext';

// Import existing high-fidelity animated mascots including the DynamicFlame streak mascot
import {
  DynamicStar,
  DynamicMoon,
  DynamicSun,
  DynamicChainLink,
  DynamicFlash,
  DynamicLighthouse,
  DynamicWordWeave,
  DynamicFlame
} from '../../shared/components/MascotCharacters';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Mascot display size constant
const MASCOT_SIZE = 56;

// Dynamic top yellow height (52% of the viewport)
const TOP_HEIGHT = screenHeight * 0.52;

// Helper to snap animated nodes safely on native thread
const snapNative = (node, val) => {
  Animated.timing(node, { toValue: val, duration: 0, useNativeDriver: true }).start();
};

export default function LoginScreen({ navigation }) {
  const { loginWithEmail, signupWithEmail } = useApp();
  // Rigorous State Machine Phases:
  // 'idle' ➔ 'mascots' ➔ 'login' ➔ 'ready'
  const [animationPhase, setAnimationPhase] = useState('idle');
  const [showSkip, setShowSkip] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  // Standard Animated Progress Values (0 to 1) driven natively
  const starProgress = useRef(new Animated.Value(0)).current;
  const moonProgress = useRef(new Animated.Value(0)).current;
  const brainProgress = useRef(new Animated.Value(0)).current;
  const linkProgress = useRef(new Animated.Value(0)).current;
  const weaveProgress = useRef(new Animated.Value(0)).current;
  const lighthouseProgress = useRef(new Animated.Value(0)).current;
  const sunProgress = useRef(new Animated.Value(0)).current;
  const flashProgress = useRef(new Animated.Value(0)).current;

  // Viewport crossfade progress values inside the phone mockup
  const brainOpacity = useRef(new Animated.Value(0)).current;

  // Login Form stagger overlay fade value
  const formOpacity = useRef(new Animated.Value(0)).current;

  // Initialize and check launch states
  useEffect(() => {
    let active = true;

    const checkPreferences = async () => {
      const reducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (reducedMotion && active) {
        skipToInstant();
        return;
      }

      try {
        const hasSeenIntro = await AsyncStorage.getItem('cognify:hasSeenIntro');
        if (active) {
          if (hasSeenIntro !== null) {
            setIsFirstLaunch(false);
            skipToInstant();
          } else {
            setIsFirstLaunch(true);
            setTimeout(() => {
              if (active) {
                setAnimationPhase('mascots'); // Start directly with choreographed mascot leaps!
                triggerMascotEntrances();
                // Offer skip button after 200ms
                setTimeout(() => {
                  if (active) setShowSkip(true);
                }, 200);
              }
            }, 300);
          }
        }
      } catch (err) {
        console.warn('[Storage] Error checking seen intro key:', err);
        if (active) skipToInstant();
      }
    };

    checkPreferences();

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (enabled && active) {
        skipToInstant();
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  // Jump to instant layout (bypassing timelines)
  const skipToInstant = () => {
    setAnimationPhase('ready');
    setShowSkip(false);

    // Snap all progress values to final safely on native thread
    snapNative(starProgress, 1);
    snapNative(moonProgress, 1);
    snapNative(brainProgress, 1);
    snapNative(linkProgress, 1);
    snapNative(weaveProgress, 1);
    snapNative(lighthouseProgress, 1);
    snapNative(sunProgress, 1);
    snapNative(flashProgress, 1);
    snapNative(formOpacity, 1);
    snapNative(brainOpacity, 1);

    AsyncStorage.setItem('cognify:hasSeenIntro', 'true').catch(() => {});
  };

  // Skip CTA trigger
  const handleSkipCTA = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setAnimationPhase('login');
    setShowSkip(false);
    
    // Quick scale-in transitions
    Animated.parallel([
      Animated.timing(starProgress, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(moonProgress, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(brainProgress, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(linkProgress, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(weaveProgress, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(lighthouseProgress, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(sunProgress, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(flashProgress, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(brainOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setAnimationPhase('ready');
      });
    });

    AsyncStorage.setItem('cognify:hasSeenIntro', 'true').catch(() => {});
  };

  // Replay initial sequence for review/debug
  const handleReplay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setAnimationPhase('idle');
    setShowSkip(true);

    snapNative(starProgress, 0);
    snapNative(moonProgress, 0);
    snapNative(brainProgress, 0);
    snapNative(linkProgress, 0);
    snapNative(weaveProgress, 0);
    snapNative(lighthouseProgress, 0);
    snapNative(sunProgress, 0);
    snapNative(flashProgress, 0);
    snapNative(formOpacity, 0);
    snapNative(brainOpacity, 0);

    setTimeout(() => {
      setAnimationPhase('mascots');
      triggerMascotEntrances();
    }, 200);
  };

  // Act 2: Choreographed Mascot Entrances + Core Mascot viewport crossfade
  const triggerMascotEntrances = () => {
    Animated.parallel([
      // Fade in the enlarged flame character inside the viewport
      Animated.timing(brainOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // 1. DynamicStar: energetic top-right dash
      Animated.timing(starProgress, {
        toValue: 1,
        duration: 400,
        easing: Easing.elastic(1.1),
        useNativeDriver: true,
      }),

      // 2. DynamicMoon: calm downward drift from above
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(moonProgress, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ]),

      // 3. DynamicSun: spring pop bounce from below
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(sunProgress, {
          toValue: 1,
          duration: 500,
          easing: Easing.elastic(1.15),
          useNativeDriver: true,
        })
      ]),

      // 4. DynamicChainLink: horizontal left overshoot slide
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(linkProgress, {
          toValue: 1,
          duration: 450,
          easing: Easing.elastic(1.0),
          useNativeDriver: true,
        })
      ]),

      // 5. DynamicWordWeave: right roll horizontal spin
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(weaveProgress, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]),

      // 6. DynamicLighthouse: slow vertical rise
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(lighthouseProgress, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ]),

      // 7. DynamicFlash: lightning bottom-right zip
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(flashProgress, {
          toValue: 1,
          duration: 300,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      setTimeout(() => {
        handleAllArrivalsComplete();
      }, 200);
    });
  };

  const handleAllArrivalsComplete = () => {
    setAnimationPhase('login');
    setShowSkip(false);

    Animated.timing(formOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setAnimationPhase('ready');
      }
    });

    AsyncStorage.setItem('cognify:hasSeenIntro', 'true').catch(() => {});
  };

  const handleLoginSubmit = async (method, data) => {
    if (method === 'email') {
      const { email, password, isSignUp } = data;
      if (isSignUp) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } else {
      // Mock / fallback for Social SSO
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`[Social Auth] Method: ${method} initialized.`);
      // Register a mock user for demo when clicking Google or Apple
      await signupWithEmail(`${method}-user@example.com`, "socialLoginSecret123");
    }
  };

  // Standard Animated Mascot styles applying entrance transforms
  const starStyle = {
    transform: [
      {
        translateX: starProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [200, 0]
        })
      },
      {
        translateY: starProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-200, 0]
        })
      },
      {
        scale: starProgress.interpolate({
          inputRange: [0, 0.6, 0.8, 1],
          outputRange: [0, 1.2, 0.9, 1]
        })
      }
    ],
    opacity: starProgress.interpolate({
      inputRange: [0, 0.1],
      outputRange: [0, 1]
    })
  };

  const moonStyle = {
    transform: [
      {
        translateY: moonProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-300, 0]
        })
      },
      {
        scale: moonProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1]
        })
      }
    ],
    opacity: moonProgress.interpolate({
      inputRange: [0, 0.15],
      outputRange: [0, 1]
    })
  };

  const linkStyle = {
    transform: [
      {
        translateX: linkProgress.interpolate({
          inputRange: [0, 0.85, 1],
          outputRange: [-250, 8, 0]
        })
      }
    ],
    opacity: linkProgress.interpolate({
      inputRange: [0, 0.15],
      outputRange: [0, 1]
    })
  };

  const weaveStyle = {
    transform: [
      {
        translateX: weaveProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [250, 0]
        })
      },
      {
        rotate: weaveProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '0deg']
        })
      }
    ],
    opacity: weaveProgress.interpolate({
      inputRange: [0, 0.15],
      outputRange: [0, 1]
    })
  };

  const lighthouseStyle = {
    transform: [
      {
        translateY: lighthouseProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [250, 0]
        })
      }
    ],
    opacity: lighthouseProgress.interpolate({
      inputRange: [0, 0.15],
      outputRange: [0, 1]
    })
  };

  const sunStyle = {
    transform: [
      {
        translateY: sunProgress.interpolate({
          inputRange: [0, 0.85, 1],
          outputRange: [300, -12, 0]
        })
      },
      {
        scale: sunProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1]
        })
      }
    ],
    opacity: sunProgress.interpolate({
      inputRange: [0, 0.15],
      outputRange: [0, 1]
    })
  };

  const flashStyle = {
    transform: [
      {
        translateX: flashProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [200, 0]
        })
      },
      {
        translateY: flashProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [200, 0]
        })
      },
      {
        scale: flashProgress.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [0, 1.3, 1]
        })
      }
    ],
    opacity: flashProgress.interpolate({
      inputRange: [0, 0.1],
      outputRange: [0, 1]
    })
  };

  const formWrapperStyle = {
    opacity: formOpacity,
    width: '100%',
  };

  const appThemeColors = useMemo(() => ({
    appBg: '#FFFFFF',
    surface: 'rgba(0, 0, 0, 0.04)',
    border: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#2D3139',
    textSecondary: '#60646D',
    textMuted: '#A0A4AC',
    brandPrimary: '#0066FF',
    textInverse: '#FFFFFF'
  }), []);

  return (
    <View style={styles.container}>
      
      {/* ======================================================== */}
      {/* DUAL-ZONE BACKGROUND LAYOUT                              */}
      {/* ======================================================== */}
      
      {/* Top Section (Warm Headspace Yellow #FFC500) */}
      <View style={styles.topSection}>
        {/* The Smartphone Mockup Container - Centered inside Top Section */}
        <View style={styles.phoneMockup}>
          <View style={styles.phoneNotch} />
          <View style={styles.phoneScreen}>
            {/* Core Mascot (DynamicFlame) scales & breathes inside smartphone screen */}
            <Animated.View style={[
              styles.phoneMascotWrapper,
              {
                opacity: brainOpacity,
                transform: [{
                  scale: brainOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1.25] // Enlarged core streak flame mascot inside viewport!
                  })
                }]
              }
            ]}>
              <DynamicFlame size={96} />
            </Animated.View>
          </View>
        </View>

        {/* 7 Mascot Characters strewn organically across the top yellow section */}
        <Animated.View style={[styles.mascotPosition, moonStyle, { top: TOP_HEIGHT * 0.12, left: screenWidth * 0.08 }]}>
          <DynamicMoon size={MASCOT_SIZE} />
        </Animated.View>
        <Animated.View style={[styles.mascotPosition, starStyle, { top: TOP_HEIGHT * 0.10, left: screenWidth * 0.74 }]}>
          <DynamicStar size={MASCOT_SIZE} />
        </Animated.View>
        <Animated.View style={[styles.mascotPosition, linkStyle, { top: TOP_HEIGHT * 0.42, left: screenWidth * 0.06 }]}>
          <DynamicChainLink size={MASCOT_SIZE} />
        </Animated.View>
        <Animated.View style={[styles.mascotPosition, sunStyle, { top: TOP_HEIGHT * 0.40, left: screenWidth * 0.78 }]}>
          <DynamicSun size={MASCOT_SIZE} />
        </Animated.View>
        <Animated.View style={[styles.mascotPosition, weaveStyle, { top: TOP_HEIGHT * 0.25, left: screenWidth * 0.82 }]}>
          <DynamicWordWeave size={MASCOT_SIZE} />
        </Animated.View>
        <Animated.View style={[styles.mascotPosition, lighthouseStyle, { top: TOP_HEIGHT * 0.72, left: screenWidth * 0.10 }]}>
          <DynamicLighthouse size={MASCOT_SIZE} />
        </Animated.View>
        <Animated.View style={[styles.mascotPosition, flashStyle, { top: TOP_HEIGHT * 0.70, left: screenWidth * 0.72 }]}>
          <DynamicFlash size={MASCOT_SIZE} />
        </Animated.View>
      </View>

      {/* Bottom Section (Pure White #FFFFFF) */}
      <View style={styles.bottomSection} />

      {/* Custom Convex Upward Curved Overlay Divider */}
      <View style={[styles.curveDivider, { top: TOP_HEIGHT - 38 }]}>
        <Svg width={screenWidth} height={80} viewBox={`0 0 ${screenWidth} 80`}>
          <Path
            d={`M 0 80 Q ${screenWidth / 2} 10 ${screenWidth} 80 L ${screenWidth} 80 L 0 80 Z`}
            fill="#FFFFFF"
          />
        </Svg>
      </View>

      {/* Floating Controls */}
      <View style={styles.headerControls}>
        {showSkip && isFirstLaunch && (
          <TouchableScale onPress={handleSkipCTA} style={styles.skipBtn}>
            <Text style={styles.skipText}>skip intro</Text>
          </TouchableScale>
        )}
        {animationPhase === 'ready' && (
          <TouchableScale onPress={handleReplay} style={styles.replayBtn}>
            <Text style={styles.replayText}>↺ replay intro</Text>
          </TouchableScale>
        )}
      </View>

      {/* ======================================================== */}
      {/* BOTTOM CONTENT AREA (Staggered Login Form)               */}
      {/* ======================================================== */}
      <View style={styles.bottomContentArea}>
        
        {/* Interactive Stagger Form */}
        <Animated.View style={[styles.formWrapper, formWrapperStyle]}>
          <LoginForm
            visible={animationPhase === 'login' || animationPhase === 'ready'}
            onLoginSubmit={handleLoginSubmit}
            onTermsPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            onPrivacyPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            Colors={appThemeColors}
          />
        </Animated.View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[10],
  },
  topSection: {
    backgroundColor: '#FFC500', // Solid Headspace Yellow
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOP_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    backgroundColor: '#FFFFFF', // Solid White
    position: 'absolute',
    top: TOP_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
  },
  curveDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 80,
    zIndex: 2,
  },
  headerControls: {
    position: 'absolute',
    top: 56,
    left: Spacing[6],
    right: Spacing[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 200,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: Radius.full,
  },
  skipText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: '#2D3139',
  },
  replayBtn: {
    borderColor: 'rgba(45, 49, 57, 0.15)',
    borderWidth: 1.2,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  replayText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: '#2D3139',
  },
  phoneMockup: {
    width: 172,
    height: 252,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#2D3139',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 20,
  },
  phoneNotch: {
    width: 48,
    height: 10,
    backgroundColor: '#FAF5F0',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    alignSelf: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 30,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#FAF5F0', // Headspace Cream Viewport
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  phoneMascotWrapper: {
    position: 'absolute',
    zIndex: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotPosition: {
    position: 'absolute',
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  bottomContentArea: {
    position: 'absolute',
    top: TOP_HEIGHT + 36, // starts comfortably below the curve
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start', // stacks elements from the top of the white half
    alignItems: 'center',
    zIndex: 50,
  },
  formWrapper: {
    width: '100%',
    zIndex: 100,
  },
});
