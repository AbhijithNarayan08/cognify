import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowRight } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';
import { TouchableScale, FadeInUp } from '../../components/Motion';
import {
  DynamicLighthouse,
  DynamicChainLink,
  DynamicFlash,
  DynamicBrain,
  DynamicWordWeave,
  DynamicSun
} from '../../shared/components/MascotCharacters';

const { width, height } = Dimensions.get('window');

export default function IntentScreen({ route, navigation }) {
  const { taskIndex = 0, scores = {} } = route.params || {};
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, [taskIndex]);

  const taskDetails = useMemo(() => {
    switch (taskIndex) {
      case 0:
        return {
          title: t('exercise.lighthouse-watch.name'),
          subhead: t('onboarding.intent.subhead.attention'),
          color: Colors.domain?.attention?.main || '#3DAB7F',
          cardBg: '#1D2340',
          Mascot: DynamicLighthouse,
          briefTitle: t('onboarding.intent.briefTitle'),
          briefText: t('onboarding.intent.lighthouse-watch.briefText'),
          bullets: [
            { bold: t('onboarding.intent.lighthouse-watch.bullet.1.bold'), text: t('onboarding.intent.lighthouse-watch.bullet.1.text') },
            { bold: t('onboarding.intent.lighthouse-watch.bullet.2.bold'), text: t('onboarding.intent.lighthouse-watch.bullet.2.text') },
            { bold: t('onboarding.intent.lighthouse-watch.bullet.3.bold'), text: t('onboarding.intent.lighthouse-watch.bullet.3.text') }
          ]
        };
      case 1:
        return {
          title: t('exercise.signal-chain.name'),
          subhead: t('onboarding.intent.subhead.memory'),
          color: Colors.domain?.memory?.main || '#0073E6',
          cardBg: '#0F1A30',
          Mascot: DynamicChainLink,
          briefTitle: t('onboarding.intent.briefTitle'),
          briefText: t('onboarding.intent.signal-chain.briefText'),
          bullets: [
            { bold: t('onboarding.intent.signal-chain.bullet.1.bold'), text: t('onboarding.intent.signal-chain.bullet.1.text') },
            { bold: t('onboarding.intent.signal-chain.bullet.2.bold'), text: t('onboarding.intent.signal-chain.bullet.2.text') },
            { bold: t('onboarding.intent.signal-chain.bullet.3.bold'), text: t('onboarding.intent.signal-chain.bullet.3.text') }
          ]
        };
      case 2:
        return {
          title: t('exercise.flash-sort.name'),
          subhead: t('onboarding.intent.subhead.speed'),
          color: Colors.domain?.speed?.main || '#FFC000',
          cardBg: '#2A2005',
          Mascot: DynamicFlash,
          briefTitle: t('onboarding.intent.briefTitle'),
          briefText: t('onboarding.intent.flash-sort.briefText'),
          bullets: [
            { bold: t('onboarding.intent.flash-sort.bullet.1.bold'), text: t('onboarding.intent.flash-sort.bullet.1.text') },
            { bold: t('onboarding.intent.flash-sort.bullet.2.bold'), text: t('onboarding.intent.flash-sort.bullet.2.text') },
            { bold: t('onboarding.intent.flash-sort.bullet.3.bold'), text: t('onboarding.intent.flash-sort.bullet.3.text') }
          ]
        };
      case 3:
        return {
          title: t('exercise.context-switch.name'),
          subhead: t('onboarding.intent.subhead.executive'),
          color: Colors.domain?.executive?.main || '#A662C6',
          cardBg: '#21102B',
          Mascot: DynamicBrain,
          briefTitle: t('onboarding.intent.briefTitle'),
          briefText: t('onboarding.intent.context-switch.briefText'),
          bullets: [
            { bold: t('onboarding.intent.context-switch.bullet.1.bold'), text: t('onboarding.intent.context-switch.bullet.1.text') },
            { bold: t('onboarding.intent.context-switch.bullet.2.bold'), text: t('onboarding.intent.context-switch.bullet.2.text') },
            { bold: t('onboarding.intent.context-switch.bullet.3.bold'), text: t('onboarding.intent.context-switch.bullet.3.text') }
          ]
        };
      case 4:
        return {
          title: t('exercise.word-weave.name'),
          subhead: t('onboarding.intent.subhead.verbal'),
          color: Colors.domain?.verbal?.main || '#FF7A00',
          cardBg: '#2E1300',
          Mascot: DynamicWordWeave,
          briefTitle: t('onboarding.intent.briefTitle'),
          briefText: t('onboarding.intent.word-weave.briefText'),
          bullets: [
            { bold: t('onboarding.intent.word-weave.bullet.1.bold'), text: t('onboarding.intent.word-weave.bullet.1.text') },
            { bold: t('onboarding.intent.word-weave.bullet.2.bold'), text: t('onboarding.intent.word-weave.bullet.2.text') },
            { bold: t('onboarding.intent.word-weave.bullet.3.bold'), text: t('onboarding.intent.word-weave.bullet.3.text') }
          ]
        };
      case 5:
        return {
          title: t('exercise.pattern-fold.name'),
          subhead: t('onboarding.intent.subhead.spatial'),
          color: Colors.domain?.spatial?.main || '#FF7DB4',
          cardBg: '#2E0F1E',
          Mascot: DynamicSun,
          briefTitle: t('onboarding.intent.briefTitle'),
          briefText: t('onboarding.intent.pattern-fold.briefText'),
          bullets: [
            { bold: t('onboarding.intent.pattern-fold.bullet.1.bold'), text: t('onboarding.intent.pattern-fold.bullet.1.text') },
            { bold: t('onboarding.intent.pattern-fold.bullet.2.bold'), text: t('onboarding.intent.pattern-fold.bullet.2.text') },
            { bold: t('onboarding.intent.pattern-fold.bullet.3.bold'), text: t('onboarding.intent.pattern-fold.bullet.3.text') }
          ]
        };
      default:
        return null;
    }
  }, [taskIndex, Colors]);

  if (!taskDetails) return null;

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Assessment', { taskIndex, scores });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('QuickProfile');
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Title */}
      <View style={styles.header}>
        <Text style={styles.headline}>{taskDetails.title}</Text>
        <Text style={[styles.subhead, { color: taskDetails.color }]}>{taskDetails.subhead}</Text>
      </View>

      <ScrollViewContainer styles={styles}>
        {/* Animated preview card */}
        <FadeInUp delay={200} distance={30} style={[styles.previewCard, { backgroundColor: taskDetails.cardBg }, Shadow.md]}>
          <taskDetails.Mascot size={140} />
        </FadeInUp>

        {/* Coach briefing */}
        <FadeInUp delay={400} distance={20} style={styles.briefSection}>
          <Text style={styles.sectionTitle}>{taskDetails.briefTitle}</Text>
          <Text style={styles.briefText}>
            {taskDetails.briefText}
          </Text>
        </FadeInUp>

        {/* Bullet points */}
        <FadeInUp delay={550} distance={20} style={styles.bulletsList}>
          {taskDetails.bullets.map((bullet, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: taskDetails.color }]} />
              <Text style={styles.bulletText}>
                <Text style={styles.bulletBold}>{bullet.bold}</Text>
                {bullet.text}
              </Text>
            </View>
          ))}
        </FadeInUp>

        {/* Action zone */}
        <FadeInUp delay={700} distance={20} style={styles.actionZone}>
          <Text style={styles.timeNote}>{t('onboarding.intent.timeNote')}</Text>
          
          <TouchableScale style={[styles.playButton, { backgroundColor: taskDetails.color }]} onPress={handlePlay}>
            <Text style={styles.playButtonText}>{t('onboarding.intent.start')}</Text>
            <ArrowRight size={18} color={Colors.textInverse} style={{ marginLeft: 6 }} />
          </TouchableScale>

          <TouchableScale style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('onboarding.intent.skip')}</Text>
          </TouchableScale>
        </FadeInUp>
      </ScrollViewContainer>
    </Animated.View>
  );
}

// Lightweight inner ScrollView to guarantee scrolling on narrow screens
function ScrollViewContainer({ children, styles }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {children}
    </ScrollView>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
    paddingTop: height > 800 ? 56 : 42,
  },
  header: {
    paddingHorizontal: Spacing[6],
    marginBottom: Spacing[3],
  },
  headline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  subhead: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  scrollContainer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[10],
    gap: Spacing[5],
  },
  previewCard: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefSection: {
    gap: Spacing[2],
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: Colors.textPrimary,
  },
  briefText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  bulletsList: {
    gap: Spacing[3],
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.body - 1,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  bulletBold: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  actionZone: {
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  timeNote: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
  },
  playButton: {
    borderRadius: Radius.full,
    paddingVertical: 18,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
  skipButton: {
    paddingVertical: Spacing[2],
  },
  skipText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    color: Colors.textMuted,
  },
});
