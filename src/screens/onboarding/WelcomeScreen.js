import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Image, ScrollView } from 'react-native';
import { useThemeColors, Typography, Spacing, Radius } from '../../theme';
import { t } from '../../constants/useStrings';
import { TouchableScale, FadeInUp } from '../../components/Motion';
import { useApp } from '../../context/AppContext';
import { DynamicStar } from '../../shared/components/MascotCharacters';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Curved Graphic Area Floating Elements
const Cloud = ({ top, left, scale = 1, opacity = 1 }) => (
  <View style={{ position: 'absolute', top, left, transform: [{ scale }], opacity }}>
    <Image 
      source={require('../../../assets/characters/usemascot.png')} 
      style={{ width: 40, height: 40, opacity: 0.15 }}
      resizeMode="contain"
    />
  </View>
);

export default function WelcomeScreen({ navigation }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const { dispatch } = useApp();

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Intent');
  };

  const handleDebugSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
        
        {/* Mascot */}
        <FadeInUp delay={200} style={styles.mascotWrapper} distance={40}>
          <DynamicStar size={168} />
        </FadeInUp>
      </View>

      <ScrollView contentContainerStyle={styles.bottomContent} showsVerticalScrollIndicator={false}>
        <FadeInUp delay={400} distance={20} style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.title}>{t('onboarding.welcome.newHeadline')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.welcome.newSubtitle')}
          </Text>
        </FadeInUp>

        <FadeInUp delay={600} distance={20} style={styles.actions}>
          <TouchableScale
            style={styles.primaryButton}
            onPress={handleStart}
          >
            <Text style={styles.primaryButtonText}>{t('onboarding.welcome.getStarted')}</Text>
          </TouchableScale>

          <TouchableScale
            style={styles.debugButton}
            onPress={handleDebugSkip}
          >
            <Text style={styles.debugButtonText}>{t('onboarding.welcome.skipOnboardingDev')}</Text>
          </TouchableScale>
        </FadeInUp>
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topGraphic: {
    height: height * 0.46,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  curvedBackground: {
    position: 'absolute',
    top: -height * 0.54,
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
    marginTop: height * 0.08,
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
    fontSize: 34,
    color: '#1A2A3A',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: Spacing[3],
  },
  subtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing[2],
  },
  actions: {
    width: '100%',
    marginTop: Spacing[6],
  },
  primaryButton: {
    backgroundColor: '#0066FF', // Vibrant blue
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: '#FFFFFF',
  },
  debugButton: {
    marginTop: Spacing[2],
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
