import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowRight } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
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
          title: 'lighthouse watch',
          subhead: 'sustained attention',
          color: Colors.domain?.attention?.main || '#3DAB7F',
          cardBg: '#1D2340',
          Mascot: DynamicLighthouse,
          briefTitle: 'what your brain is doing',
          briefText: "you're sharpening your visual radar, training your brain to lock onto high-value targets while muting the background noise of distractions.",
          bullets: [
            { bold: 'target: ', text: 'tap ONLY when you see the glowing green star.' },
            { bold: 'focus: ', text: 'avoid clicking shapes of other colors.' },
            { bold: 'calibration: ', text: 'accuracy and speed combine to build your focus score.' }
          ]
        };
      case 1:
        return {
          title: 'signal chain',
          subhead: 'working memory',
          color: Colors.domain?.memory?.main || '#0073E6',
          cardBg: '#0F1A30',
          Mascot: DynamicChainLink,
          briefTitle: 'what your brain is doing',
          briefText: "you're stretching your short-term recall capacity, linking spatial nodes in sequential order to build a stronger mental scratchpad.",
          bullets: [
            { bold: 'pattern: ', text: 'watch carefully as the nodes pulse in a specific sequence.' },
            { bold: 'recall: ', text: 'tap the nodes in the exact same sequence you just saw.' },
            { bold: 'challenge: ', text: 'the sequence grows longer with each successful round.' }
          ]
        };
      case 2:
        return {
          title: 'flash sort',
          subhead: 'processing speed',
          color: Colors.domain?.speed?.main || '#FFC000',
          cardBg: '#2A2005',
          Mascot: DynamicFlash,
          briefTitle: 'what your brain is doing',
          briefText: "you're accelerating your visual-motor processing speed, training your brain to make lightning-fast sorting decisions under pressure.",
          bullets: [
            { bold: 'sort: ', text: 'tap left for circles and right for squares as they appear.' },
            { bold: 'speed: ', text: 'react as fast as possible to maximize your speed bonus.' },
            { bold: 'distraction: ', text: 'ignore changing colors and background stripes.' }
          ]
        };
      case 3:
        return {
          title: 'context switch',
          subhead: 'executive function',
          color: Colors.domain?.executive?.main || '#A662C6',
          cardBg: '#21102B',
          Mascot: DynamicBrain,
          briefTitle: 'what your brain is doing',
          briefText: "you're conditioning your cognitive flexibility, training your brain to switch rapidly and smoothly between different classification rules.",
          bullets: [
            { bold: 'rule 1: ', text: 'when the border is blue, classify the central shape.' },
            { bold: 'rule 2: ', text: 'when the border is red, classify the shape\'s fill color.' },
            { bold: 'agility: ', text: 'adapt quickly as the borders change to minimize switch cost.' }
          ]
        };
      case 4:
        return {
          title: 'word weave',
          subhead: 'verbal reasoning',
          color: Colors.domain?.verbal?.main || '#FF7A00',
          cardBg: '#2E1300',
          Mascot: DynamicWordWeave,
          briefTitle: 'what your brain is doing',
          briefText: "you're sharpening your semantic mapping and lexical retrieval, identifying relational patterns between pairs of words.",
          bullets: [
            { bold: 'analogy: ', text: 'identify the relationship between the first pair of words.' },
            { bold: 'solve: ', text: 'select the word that completes the second pair in the same way.' },
            { bold: 'vocabulary: ', text: 'think logically to build your verbal reasoning score.' }
          ]
        };
      case 5:
        return {
          title: 'pattern fold',
          subhead: 'spatial cognition',
          color: Colors.domain?.spatial?.main || '#FF7DB4',
          cardBg: '#2E0F1E',
          Mascot: DynamicSun,
          briefTitle: 'what your brain is doing',
          briefText: "you're training your mental rotation and spatial projection, visualizing how 2D nets fold into 3D objects from different perspectives.",
          bullets: [
            { bold: 'visualize: ', text: 'look at the target block grid pattern on the left.' },
            { bold: 'rotate: ', text: 'mentally rotate the pattern to identify the matching choice.' },
            { bold: 'chirality: ', text: 'watch out for tricky flipped mirror distractors.' }
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
          <Text style={styles.timeNote}>~30 seconds per session</Text>
          
          <TouchableScale style={[styles.playButton, { backgroundColor: taskDetails.color }]} onPress={handlePlay}>
            <Text style={styles.playButtonText}>start training</Text>
            <ArrowRight size={18} color={Colors.textInverse} style={{ marginLeft: 6 }} />
          </TouchableScale>

          <TouchableScale style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>skip for now</Text>
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
    textTransform: 'lowercase',
    lineHeight: 36,
  },
  subhead: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
  },
  briefText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
  },
  skipButton: {
    paddingVertical: Spacing[2],
  },
  skipText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    color: Colors.textMuted,
    textTransform: 'lowercase',
  },
});
