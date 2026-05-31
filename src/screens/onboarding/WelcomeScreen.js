import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Image, ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Star as SvgStar } from 'react-native-svg';
import { Square, CheckSquare } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius } from '../../theme';
import { t } from '../../constants/useStrings';
import { TouchableScale, FadeInUp } from '../../components/Motion';
import { useApp } from '../../context/AppContext';

const { width, height } = Dimensions.get('window');

// ── Floating Decorative Elements ──────────────────────────────────────────
const Cloud = ({ top, left, scale = 1, opacity = 1 }) => (
  <View style={{ position: 'absolute', top, left, transform: [{ scale }], opacity }}>
    <Svg width="50" height="30" viewBox="0 0 50 30">
      <Path d="M 15 30 Q 5 30 5 20 Q 5 10 15 10 Q 20 0 30 5 Q 40 -5 45 10 Q 55 15 45 25 Q 45 30 30 30 Z" fill="#FFFFFF" />
    </Svg>
  </View>
);

const StarElement = ({ top, left, scale = 1, color = "#FFF" }) => (
  <View style={{ position: 'absolute', top, left, transform: [{ scale }] }}>
    <Svg width="20" height="20" viewBox="0 0 20 20">
      <Path d="M 10 0 L 13 7 L 20 10 L 13 13 L 10 20 L 7 13 L 0 10 L 7 7 Z" fill={color} />
    </Svg>
  </View>
);

export default function WelcomeScreen({ navigation }) {
  const Colors = useThemeColors();
  const { dispatch } = useApp();
  const [agreed, setAgreed] = useState(false);

  const handleDebugSkip = () => {
    const cognitiveScore = 715;
    const filledScores = {
      memory: 730,
      speed: 685,
      attention: 750,
      executive: 700,
      verbal: 740,
      spatial: 690,
    };
    
    dispatch({
      type: 'COMPLETE_ASSESSMENT',
      payload: {
        cognitiveScore,
        domainScores: filledScores,
        brainAge: 26,
        cohortPercentile: 78,
      }
    });

    dispatch({
      type: 'COMPLETE_ONBOARDING',
      payload: { cognitiveScore }
    });

    navigation.replace('MainApp');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top curved graphic area */}
      <View style={styles.topGraphic}>
        <View style={styles.curvedBackground} />
        
        {/* Decorative background elements */}
        <Cloud top={height * 0.1} left={width * 0.1} scale={1.2} opacity={0.4} />

        {/* Mascot */}
        <FadeInUp delay={200} style={styles.mascotWrapper} distance={40}>
          <Image 
            source={require('../../../assets/characters/usemascot.png')} 
            style={styles.mascot}
            resizeMode="contain"
          />
        </FadeInUp>
      </View>

      <ScrollView contentContainerStyle={styles.bottomContent} showsVerticalScrollIndicator={false}>
        <FadeInUp delay={400} distance={20} style={{ alignItems: 'center' }}>
          <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.welcome.subtitle')}
          </Text>
          <Text style={styles.highlightText}>
            {t('onboarding.welcome.highlight')}
          </Text>
        </FadeInUp>

        <FadeInUp delay={600} distance={20} style={styles.actions}>
          {/* Terms checkbox */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            activeOpacity={0.7}
            onPress={() => setAgreed(!agreed)}
          >
            {agreed ? (
              <CheckSquare color={Colors.brandPrimary} size={24} />
            ) : (
              <Square color={Colors.textMuted} size={24} />
            )}
            <Text style={styles.checkboxText}>
              {t('onboarding.welcome.termsAgreement')}
            </Text>
          </TouchableOpacity>

          <TouchableScale
            style={[styles.primaryButton, !agreed && styles.buttonDisabled]}
            onPress={() => agreed && navigation.navigate('Intent')}
            disabled={!agreed}
          >
            <Text style={styles.primaryButtonText}>{t('onboarding.welcome.createAccount')}</Text>
          </TouchableScale>

          <TouchableScale
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>{t('onboarding.welcome.login')}</Text>
          </TouchableScale>

          <TouchableScale
            style={styles.debugButton}
            onPress={handleDebugSkip}
          >
            <Text style={styles.debugButtonText}>{t('onboarding.welcome.debugSkip')}</Text>
          </TouchableScale>
        </FadeInUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topGraphic: {
    height: height * 0.5,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  curvedBackground: {
    position: 'absolute',
    top: -height * 0.5, // Shift up so the bottom curve lands around height * 0.5
    left: -width * 0.5,
    width: width * 2,
    height: height,
    borderRadius: width,
    backgroundColor: '#FFB300', // Cheerful yellow/orange
  },
  mascotWrapper: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  mascot: {
    width: 340,
    height: 340,
  },
  bottomContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 36,
    color: '#1A2A3A',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: Spacing[3],
  },
  subtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing[2],
  },
  highlightText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: '#1B6CA8', // Brand blue
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: Spacing[6],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[6],
    paddingRight: Spacing[4],
  },
  checkboxText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: '#4A5568',
    marginLeft: Spacing[3],
    lineHeight: 20,
    flex: 1,
  },
  linkText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: '#1B6CA8', // Brand blue
  },
  primaryButton: {
    backgroundColor: '#0066FF', // Vibrant blue
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
    opacity: 0.7,
  },
  secondaryButton: {
    backgroundColor: '#F7FAFC',
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: '#1A2A3A',
  },
  debugButton: {
    marginTop: Spacing[4],
    borderWidth: 1.5,
    borderColor: '#FF5E5B',
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    opacity: 0.85,
  },
  debugButtonText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: '#FF5E5B',
  },
});
