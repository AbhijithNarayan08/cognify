import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView,
} from 'react-native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';
import { TouchableScale, FadeInUp } from '../../components/Motion';
import { ProjectionGraph } from '../../components/UIComponents';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function ProjectionScreen({ navigation, route }) {
  const { state, dispatch } = useApp();
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const cognitiveScore = route?.params?.cognitiveScore || state.cognitiveScore || 680;

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('NotificationOptIn', { cognitiveScore });
  };

  // Dimensions of SVG
  const svgWidth = Math.min(width - Spacing[6] * 2, 340);

  return (
    <View style={styles.container}>
      {/* Top Bar with Back Button & Progress Track */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { backgroundColor: Colors.brandPrimary }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInUp delay={100} distance={20}>
          <Text style={styles.headline}>{t('onboarding.projection.headline')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.projection.subtitle')}
          </Text>
        </FadeInUp>

        {/* Graph Card */}
        <FadeInUp delay={300} distance={30} style={[styles.graphCard, Shadow.md]}>
          <ProjectionGraph cognitiveScore={cognitiveScore} containerWidth={svgWidth} />
        </FadeInUp>

        {/* Caption */}
        <FadeInUp delay={500} distance={20} style={styles.captionContainer}>
          <Text style={styles.captionText}>
            {t('onboarding.projection.caption')}
          </Text>
        </FadeInUp>

        {/* CTA Section */}
        <FadeInUp delay={650} distance={20} style={styles.ctaWrapper}>
          <TouchableScale style={styles.cta} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.ctaText}>{t('onboarding.projection.cta')}</Text>
            <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: 6 }} />
          </TouchableScale>
        </FadeInUp>
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: height > 800 ? 56 : 42,
    paddingBottom: Spacing[3],
    justifyContent: 'space-between',
  },
  backButton: {
    padding: Spacing[2],
    borderRadius: Radius.full,
    marginLeft: -Spacing[2],
  },
  progressTrack: {
    height: 6,
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    marginLeft: Spacing[4],
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: Radius.full,
    width: '92%', // Representing 92% progress (final step of onboarding)
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[10],
  },
  headline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    lineHeight: 38,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing[6],
  },
  graphCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[5],
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing[6],
    marginTop: Spacing[4],
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
  },
  captionContainer: {
    marginBottom: Spacing[8],
  },
  captionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption + 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
  },
  ctaWrapper: {
    width: '100%',
    marginTop: 'auto',
  },
  cta: {
    backgroundColor: Colors.coral,
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ctaText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
});
