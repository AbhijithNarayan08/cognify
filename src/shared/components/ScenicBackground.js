import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Defs, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Reusable layout background system displaying Headspace-inspired organic
 * shapes, scenic waves, concentric sun rings, and friendly sleeping faces.
 *
 * Presets:
 * - 'auth': Bright yellow sky, large orange sun with sleeping face, white clouds.
 * - 'welcome': Warm yellow sky, giant mascot sun backdrop, organic waves.
 * - 'home': Soft linen/yellow top sky with rolling forest green and peach wavy hills at the bottom.
 * - 'train': Soothing peach-to-pink gradient, floating soft cream clouds/circles.
 * - 'insights': Focus-promoting deep blue to sky blue gradient with organic waves.
 * - 'onboarding': Concentric radiating warm yellow/orange circles behind centered content cards.
 */
export default function ScenicBackground({ preset = 'home' }) {
  const Colors = useThemeColors();

  const renderContent = useMemo(() => {
    switch (preset) {
      case 'auth':
      case 'welcome': {
        // Bright yellow sky backdrop to orange sun and soft floating clouds
        const isAuth = preset === 'auth';
        const sunY = isAuth ? screenHeight * 0.28 : screenHeight * 0.23;
        const sunR = isAuth ? 120 : 160;

        return (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={[Colors.scenicYellow, Colors.scenicOrange]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Svg style={StyleSheet.absoluteFill}>
              {/* Concentric glow rings */}
              <Circle cx={screenWidth * 0.5} cy={sunY} r={sunR + 80} fill={Colors.scenicYellow} opacity={0.3} />
              <Circle cx={screenWidth * 0.5} cy={sunY} r={sunR + 40} fill={Colors.scenicYellow} opacity={0.5} />

              {/* Mascot Sun */}
              <Circle cx={screenWidth * 0.5} cy={sunY} r={sunR} fill={Colors.scenicCoral} />

              {SunFace(screenWidth * 0.5, sunY)}

              {/* Floating Clouds */}
              {/* Left Cloud */}
              <G opacity={0.9} transform={`translate(${-40}, ${sunY + (isAuth ? 60 : 100)})`}>
                <Path
                  d="M 120,40 C 120,30 130,20 145,20 C 150,20 155,22 160,25 C 165,15 178,8 190,8 C 205,8 217,18 220,30 C 223,28 227,28 230,28 C 242,28 252,38 252,50 C 252,62 242,72 230,72 L 120,72 Z"
                  fill="#FFFFFF"
                />
              </G>

              {/* Right Cloud */}
              <G opacity={0.9} transform={`translate(${screenWidth - 200}, ${sunY - (isAuth ? 100 : 80)})`}>
                <Path
                  d="M 50,40 C 50,30 60,20 75,20 C 80,20 85,22 90,25 C 95,15 108,8 120,8 C 135,8 147,18 150,30 C 153,28 157,28 160,28 C 172,28 182,38 182,50 C 182,62 172,72 160,72 L 50,72 Z"
                  fill="#FFFFFF"
                />
              </G>

              {/* Bottom organic wave overlay for welcome screen */}
              {!isAuth && (
                <Path
                  d={`M 0,${screenHeight * 0.75} Q ${screenWidth * 0.25},${screenHeight * 0.72} ${screenWidth * 0.5},${screenHeight * 0.76} T ${screenWidth},${screenHeight * 0.74} L ${screenWidth},${screenHeight} L 0,${screenHeight} Z`}
                  fill={Colors.scenicLinen}
                />
              )}
            </Svg>
          </View>
        );
      }

      case 'home': {
        // Soft linen sky with hills
        return (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={[Colors.scenicLinen, '#FFF4D0']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
            />
            <Svg style={StyleSheet.absoluteFill}>
              {/* Background Cloud */}
              <G opacity={0.65} transform={`translate(${screenWidth - 170}, ${screenHeight * 0.12})`}>
                <Path
                  d="M 30,30 C 30,22 38,15 48,15 C 52,15 56,17 60,19 C 64,12 73,7 82,7 C 93,7 102,14 104,22 C 106,20 110,20 112,20 C 121,20 128,27 128,35 C 128,43 121,50 112,50 L 30,50 Z"
                  fill="#FFFFFF"
                />
              </G>

              {/* Rolling Peach Wave (Hill 1) */}
              <Path
                d={`M 0,${screenHeight * 0.62} Q ${screenWidth * 0.4},${screenHeight * 0.54} ${screenWidth * 0.75},${screenHeight * 0.65} T ${screenWidth},${screenHeight * 0.6} L ${screenWidth},${screenHeight} L 0,${screenHeight} Z`}
                fill={Colors.scenicPeach}
                opacity={0.7}
              />

              {/* Rolling Green Wave (Hill 2) */}
              <Path
                d={`M 0,${screenHeight * 0.75} C ${screenWidth * 0.25},${screenHeight * 0.78} ${screenWidth * 0.65},${screenHeight * 0.68} ${screenWidth},${screenHeight * 0.74} L ${screenWidth},${screenHeight} L 0,${screenHeight} Z`}
                fill={Colors.scenicGreen}
                opacity={0.85}
              />

              {/* Grassy Accent Shape */}
              <Path
                d={`M 0,${screenHeight * 0.88} Q ${screenWidth * 0.5},${screenHeight * 0.82} ${screenWidth},${screenHeight * 0.9} L ${screenWidth},${screenHeight} L 0,${screenHeight} Z`}
                fill={Colors.scenicLinen}
              />
            </Svg>
          </View>
        );
      }

      case 'train': {
        // Soothing peach/pink sky with floating soft white shapes
        return (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={[Colors.scenicPeach, Colors.scenicPink]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Svg style={StyleSheet.absoluteFill}>
              {/* Concentric ambient background circles */}
              <Circle cx={screenWidth * 0.85} cy={screenHeight * 0.25} r={160} fill="#FFFFFF" opacity={0.12} />
              <Circle cx={screenWidth * 0.15} cy={screenHeight * 0.65} r={200} fill="#FFFFFF" opacity={0.15} />

              {/* Soft decorative cloud */}
              <G opacity={0.75} transform={`translate(${40}, ${screenHeight * 0.15})`}>
                <Path
                  d="M 50,40 C 50,30 60,20 75,20 C 80,20 85,22 90,25 C 95,15 108,8 120,8 C 135,8 147,18 150,30 C 153,28 157,28 160,28 C 172,28 182,38 182,50 C 182,62 172,72 160,72 L 50,72 Z"
                  fill={Colors.scenicLinen}
                />
              </G>

              {/* Wave accent at the bottom */}
              <Path
                d={`M 0,${screenHeight * 0.8} Q ${screenWidth * 0.5},${screenHeight * 0.74} ${screenWidth},${screenHeight * 0.82} L ${screenWidth},${screenHeight} L 0,${screenHeight} Z`}
                fill={Colors.scenicLinen}
              />
            </Svg>
          </View>
        );
      }

      case 'insights': {
        // Focus blue to purple wave landscape
        const darkTheme = Colors.appBg === '#1A1F3A';
        const startColor = darkTheme ? '#1A1F3A' : '#3A6EEA';
        const endColor = darkTheme ? '#2D3561' : '#87CEEB';

        return (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={[startColor, endColor]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Svg style={StyleSheet.absoluteFill}>
              {/* Smiling blue moon backdrop */}
              <Circle cx={screenWidth * 0.8} cy={screenHeight * 0.22} r={80} fill={Colors.scenicLightBlue} opacity={0.25} />
              <Circle cx={screenWidth * 0.8} cy={screenHeight * 0.22} r={55} fill={Colors.scenicLightBlue} opacity={0.4} />

              <G transform={`translate(${screenWidth * 0.8 - 55}, ${screenHeight * 0.22 - 55})`}>
                <Path d="M 45,50 Q 50,53 55,50" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                <Path d="M 60,50 Q 65,53 70,50" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                <Path d="M 52,57 Q 57.5,60 63,57" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" />
              </G>

              {/* Flowing Water Waves */}
              <Path
                d={`M 0,${screenHeight * 0.65} Q ${screenWidth * 0.3},${screenHeight * 0.7} ${screenWidth * 0.6},${screenHeight * 0.62} T ${screenWidth},${screenHeight * 0.68} L ${screenWidth},${screenHeight} L 0,${screenHeight} Z`}
                fill={Colors.scenicLinen}
                opacity={0.3}
              />

              <Path
                d={`M 0,${screenHeight * 0.76} C ${screenWidth * 0.25},${screenHeight * 0.72} ${screenWidth * 0.75},${screenHeight * 0.82} ${screenWidth},${screenHeight * 0.75} L ${screenWidth},${screenHeight} L 0,${screenHeight} Z`}
                fill={Colors.scenicLinen}
                opacity={0.65}
              />

              <Path
                d={`M 0,${screenHeight * 0.86} Q ${screenWidth * 0.5},${screenHeight * 0.82} ${screenWidth},${screenHeight * 0.9} L ${screenWidth},${screenHeight} L 0,${screenHeight} Z`}
                fill={Colors.scenicLinen}
              />
            </Svg>
          </View>
        );
      }

      case 'onboarding': {
        // Concentric radiating sun waves behind screen content cards
        return (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={[Colors.scenicLinen, '#FCE6C4']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Svg style={StyleSheet.absoluteFill}>
              {/* Concentric rings placed perfectly behind standard onboarding card centers */}
              <Circle cx={screenWidth * 0.5} cy={screenHeight * 0.4} r={280} stroke={Colors.scenicOrange} strokeWidth={1.5} opacity={0.06} fill="none" />
              <Circle cx={screenWidth * 0.5} cy={screenHeight * 0.4} r={220} stroke={Colors.scenicOrange} strokeWidth={2} strokeDasharray="6,6" opacity={0.08} fill="none" />
              <Circle cx={screenWidth * 0.5} cy={screenHeight * 0.4} r={160} stroke={Colors.scenicOrange} strokeWidth={2.5} opacity={0.12} fill="none" />
              <Circle cx={screenWidth * 0.5} cy={screenHeight * 0.4} r={100} fill={Colors.scenicOrange} opacity={0.05} />
            </Svg>
          </View>
        );
      }

      default:
        return null;
    }
  }, [preset, Colors, screenWidth, screenHeight]);

  return (
    <View pointerEvents="none" style={styles.absoluteContainer}>
      {renderContent}
    </View>
  );
}

// Helper: Sun Sleeping/Smiling Face Illustration
function SunFace(cx, cy) {
  return (
    <G>
      {/* Left Eye */}
      <Path
        d={`M ${cx - 32},${cy - 8} Q ${cx - 24},${cy + 2} ${cx - 16},${cy - 8}`}
        stroke="#1D2340"
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Right Eye */}
      <Path
        d={`M ${cx + 16},${cy - 8} Q ${cx + 24},${cy + 2} ${cx + 32},${cy - 8}`}
        stroke="#1D2340"
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Smile */}
      <Path
        d={`M ${cx - 18},${cy + 16} Q ${cx},${cy + 32} ${cx + 18},${cy + 16}`}
        stroke="#1D2340"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

const styles = StyleSheet.create({
  absoluteContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -10,
  },
});
