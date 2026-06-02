import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { Flame, ArrowRight, Check, X, Shield } from 'lucide-react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import ScoreRing from '../../components/ScoreRing';
import {
  DomainTile, InsightCard, WorkoutCard, CheckinCard, SectionHeader,
} from '../../components/UIComponents';
import { FadeInUp, TouchableScale } from '../../components/Motion';
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';
import { t } from '../../constants/useStrings';
import { DAILY_WORKOUT, INSIGHT_TEMPLATES } from '../../data/exercises';
import { useGreeting } from '../../features/home/hooks/useGreeting';
import { useCheckins } from '../../features/home/hooks/useCheckins';
import { analytics } from '../../services/analyticsService';
import { GameHaptics } from '../../utils/haptics';
import { CheckinBottomSheet } from '../../shared/components/CheckinBottomSheet';
import { useLegacyMigration } from '../../hooks/useLegacyMigration';

// ─────────────────────────────────────────────────────────────
// Dynamic Pulse & Sway SVG Flame Mascot Character
// ─────────────────────────────────────────────────────────────
function DynamicFlame({ pulseAnim, swayAnim, Colors }) {
  // Outer layer animations
  const outerScaleY = pulseAnim.interpolate({
    inputRange: [1, 1.12],
    outputRange: [0.97, 1.05],
  });
  const outerScaleX = pulseAnim.interpolate({
    inputRange: [1, 1.12],
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
    inputRange: [1, 1.12],
    outputRange: [1.04, 0.94], // out of phase
  });
  const middleScaleX = pulseAnim.interpolate({
    inputRange: [1, 1.12],
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
    inputRange: [1, 1.12],
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
    <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
      {/* Layer 1: Outer Flame (Coral #FF5E5B) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [
              { scaleX: outerScaleX },
              { scaleY: outerScaleY },
              { translateX: outerTranslateX },
              { rotate: outerRotate },
            ],
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Svg width={96} height={96} viewBox="0 0 100 120">
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
          {
            transform: [
              { scaleX: middleScaleX },
              { scaleY: middleScaleY },
              { translateX: middleTranslateX },
              { rotate: middleRotate },
            ],
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Svg width={76} height={76} viewBox="0 0 100 120">
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
          {
            transform: [
              { scaleY: innerScaleY },
              { translateX: innerTranslateX },
              { rotate: innerRotate },
            ],
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Svg width={56} height={56} viewBox="0 0 100 120">
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

export default function HomeScreen({ navigation }) {
  const { state } = useApp();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  // Run the background legacy migration to sync AsyncStorage score history to Firebase Firestore
  useLegacyMigration();

  const today = new Date();
  const isSundayEvening = today.getDay() === 0 && today.getHours() >= 18;

  useEffect(() => {
    analytics.track('screen_viewed', { screenName: 'Home' });
    if (isSundayEvening && state.scoreHistory && state.scoreHistory.length >= 14) {
      const trainedDaysCount = state.scoreHistory.slice(-7).filter(h => h.trained).length || 0;
      const week1Scores = state.scoreHistory.slice(-14, -7).map(h => h.score);
      const week2Scores = state.scoreHistory.slice(-7).map(h => h.score);
      const avgWeek1 = Math.round(week1Scores.reduce((a, b) => a + b, 0) / week1Scores.length);
      const avgWeek2 = Math.round(week2Scores.reduce((a, b) => a + b, 0) / week2Scores.length);
      const scoreDiff = avgWeek2 - avgWeek1;
      const diffSign = scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`;
      analytics.track('push_notification_scheduled', {
        title: 'week in review',
        body: `you trained ${trainedDaysCount} days and your score moved ${diffSign} points.`,
        scheduledTime: 'sunday at 7pm',
      });
    }
  }, [isSundayEvening, state.scoreHistory]);

  const DOMAINS = getDomains(Colors);
  const greetingText = useGreeting();
  const { pendingCheckins, handleComplete, handleDismiss } = useCheckins();

  const { cognitiveScore, domainScores, workoutComplete, workoutInProgress, streakDays, scoreHistory = [] } = state;

  // ── Checkin Sheet UI State ──────────────────────────────────
  const [checkinSheetVisible, setCheckinSheetVisible] = useState(false);
  const [checkinSheetType, setCheckinSheetType] = useState('mood');
  const [checkinSheetRating, setCheckinSheetRating] = useState(2);

  // ── Streak Modal UI State & Animations ──────────────────────
  const [showStreakModal, setShowStreakModal] = useState(false);
  const streakAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;

  // Spring scale entry transition
  useEffect(() => {
    if (showStreakModal) {
      Animated.spring(streakAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(streakAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showStreakModal]);

  // Infinite pulsing & swaying animation for the dynamic flame character
  useEffect(() => {
    let pulseAnimation;
    let swayAnimation;
    if (showStreakModal) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      swayAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: -1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      swayAnimation.start();
    } else {
      pulseAnim.setValue(1);
      swayAnim.setValue(0);
    }
    return () => {
      if (pulseAnimation) pulseAnimation.stop();
      if (swayAnimation) swayAnimation.stop();
    };
  }, [showStreakModal]);

  const handleCloseModal = () => {
    GameHaptics.correct();
    Animated.timing(streakAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowStreakModal(false);
    });
  };

  // Timezone-safe current week dates resolver
  const getWeekDays = () => {
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);

    const days = [];
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    const localTodayStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.getFullYear() + '-' + 
        String(d.getMonth() + 1).padStart(2, '0') + '-' + 
        String(d.getDate()).padStart(2, '0');
      
      const trained = scoreHistory.some(h => h.date === dateStr && h.trained);
      const isToday = dateStr === localTodayStr;
      
      const dCopy = new Date(d);
      dCopy.setHours(23, 59, 59, 999);
      const isFuture = dCopy > today && !isToday;
      
      days.push({
        dateStr,
        label: dayLabels[i],
        trained,
        isToday,
        isFuture,
      });
    }
    return days;
  };

  const scoreDisplay = cognitiveScore || 742;
  const delta = 18;

  const [showAllDomains, setShowAllDomains] = useState(false);

  // Focus domains sorted ascending (weakest first) to motivate improvement
  const focusDomains = useMemo(() => {
    if (!domainScores) return DOMAINS;
    return [...DOMAINS]
      .sort((a, b) => (domainScores[a.id] || 0) - (domainScores[b.id] || 0));
  }, [domainScores, DOMAINS]);

  const displayedDomains = showAllDomains ? DOMAINS : focusDomains.slice(0, 3);

  // ── Personal score context line (Problem 2) ──────────────────
  const hasEnoughHistory = scoreHistory.length > 3;
  const isFirstWeek = scoreHistory.length <= 7;
  const startingScore = hasEnoughHistory ? (scoreHistory[0]?.score || 400) : null;
  const scoreDeltaFromStart = startingScore ? scoreDisplay - startingScore : 0;

  let personalScoreContext = null;
  if (hasEnoughHistory && scoreDeltaFromStart > 0) {
    personalScoreContext = t('home.score.personalTrend', { delta: `+${scoreDeltaFromStart}` });
  } else if (workoutComplete && delta > 0) {
    personalScoreContext = t('home.score.workoutContribution', { delta });
  } else if (isFirstWeek) {
    personalScoreContext = t('home.score.firstWeek');
  }
  // If none apply, personalScoreContext stays null — ring is self-sufficient

  // Sticky header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [60, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <Text style={styles.stickyTitle}>{t('home.appTitle')}</Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting */}
        <FadeInUp delay={0} style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>{greetingText}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          {streakDays > 0 && (
            <TouchableScale
              style={styles.streakBadge}
              onPress={() => {
                GameHaptics.correct();
                setShowStreakModal(true);
              }}
              scaleTo={0.93}
              activeOpacity={0.85}
            >
              <Flame size={18} color={Colors.brandPrimary} />
              <Text style={styles.streakText}>{streakDays} {t(streakDays === 1 ? 'home.streak.day' : 'home.streak.days')}</Text>
            </TouchableScale>
          )}
        </FadeInUp>

        {/* Sunday Evening Banner */}
        {isSundayEvening && (
          <FadeInUp delay={50} style={styles.section}>
            <TouchableScale
              style={[styles.sundayBanner, Shadow.md]}
              onPress={() => navigation.navigate('Insights', { initialTab: 'brief' })}
            >
              <View style={styles.sundayBannerContent}>
                <View style={styles.sundayBannerLeft}>
                  <Text style={styles.sundayBannerTitle}>{t('home.sundayBanner.title')}</Text>
                  <Text style={styles.sundayBannerSub}>{t('home.sundayBanner.subtitle')}</Text>
                </View>
                <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: 6 }} />
              </View>
            </TouchableScale>
          </FadeInUp>
        )}

        {/* Score Ring Hero — Problem 2: personal context, no cohort comparison */}
        <FadeInUp delay={100} style={styles.scoreSection}>
          <ScoreRing score={scoreDisplay} delta={delta} />
          {personalScoreContext && (
            <Text style={styles.personalContextText}>{personalScoreContext}</Text>
          )}
        </FadeInUp>

        {/* Workout Card */}
        <FadeInUp delay={200} style={styles.section}>
          <WorkoutCard
            exercises={DAILY_WORKOUT}
            isComplete={workoutComplete}
            inProgress={workoutInProgress}
            onStart={() => navigation.navigate('Train', { screen: 'ActiveSession' })}
          />
        </FadeInUp>

        {/* Check-in Cards — Problem 3/4: compact horizontal layout */}
        {pendingCheckins.length > 0 && (
          <FadeInUp delay={300} style={styles.section}>
            <SectionHeader title={t('home.quickCheckin')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.checkinRow}
            >
              {pendingCheckins.map(type => (
                <View key={type} style={styles.checkinWrapper}>
                  <CheckinCard
                    type={type}
                    onComplete={(val) => {
                      setCheckinSheetType(type);
                      setCheckinSheetRating(val);
                      setCheckinSheetVisible(true);
                    }}
                    onSkip={() => handleDismiss(type)}
                  />
                  <TouchableOpacity
                    style={styles.checkinSkip}
                    onPress={() => handleDismiss(type)}
                  >
                    <Text style={styles.checkinSkipText}>{t('home.skip')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </FadeInUp>
        )}

        {/* Focus Domains Grid — Problem 6: trend handled in DomainTile */}
        {domainScores && (
          <FadeInUp delay={400} style={styles.section}>
            <SectionHeader
              title={showAllDomains ? t('home.yourDomains') : t('home.focusAreas')}
              action={showAllDomains ? t('home.collapse') : t('home.seeAll')}
              onAction={() => setShowAllDomains(!showAllDomains)}
            />
            <View style={styles.domainGrid}>
              {displayedDomains.map((domain) => (
                <DomainTile
                  key={domain.id}
                  domain={domain.id}
                  score={domainScores[domain.id]}
                  trend={Math.random() > 0.5 ? 1 : 0}
                />
              ))}
            </View>
          </FadeInUp>
        )}

        {/* Insight + Weekly Brief — Problems 7 & 8 */}
        {workoutComplete && (
          <>
            {/* Insight Card — keep amber tint, passive observation */}
            <FadeInUp delay={200} style={styles.section}>
              <SectionHeader title={t('home.insight')} />
              <InsightCard
                headline={INSIGHT_TEMPLATES[0].headline}
                body={INSIGHT_TEMPLATES[0].body}
                accent={INSIGHT_TEMPLATES[0].accent}
                bg={INSIGHT_TEMPLATES[0].bg}
              />
            </FadeInUp>

            {/* Weekly brief — Problem 7: dark navy, not orange. Problem 8: two-line headline */}
            <FadeInUp delay={300}>
              <TouchableScale
                style={[styles.briefCard, Shadow.md]}
                onPress={() => navigation.navigate('Insights', { initialTab: 'brief' })}
              >
                <Text style={styles.briefLabel}>{t('home.weeklyBrief')}</Text>
                <Text style={styles.briefHeadline}>{t('home.weeklyBrief.headline')}</Text>
                <Text style={styles.briefSubhead}>{t('home.weeklyBrief.subhead')}</Text>
                <View style={styles.briefCTARow}>
                  <Text style={styles.briefCTA}>{t('home.readNow')}</Text>
                  <ArrowRight size={14} color={Colors.brandPrimary} style={{ marginLeft: 6 }} />
                </View>
              </TouchableScale>
            </FadeInUp>
          </>
        )}

        <View style={{ height: Spacing[10] }} />
      </Animated.ScrollView>

      {/* Streak Dashboard Modal Overlay */}
      <Modal
        visible={showStreakModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleCloseModal}
          />
          <Animated.View
            style={[
              styles.modalCard,
              Shadow.lg,
              {
                opacity: streakAnim,
                transform: [
                  {
                    scale: streakAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.88, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseModal}>
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Glowing Halo & Pulsing Flame Mascot */}
            <View style={styles.flameContainer}>
              <Animated.View
                style={[
                  styles.flameHalo,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <DynamicFlame pulseAnim={pulseAnim} swayAnim={swayAnim} Colors={Colors} />
            </View>

            {/* Title / Day Counter */}
            <Text style={styles.modalTitle}>
              {streakDays}-{t(streakDays === 1 ? 'home.streak.day' : 'home.streak.days')} Streak!
            </Text>

            {/* Motivational message based on training state */}
            <Text style={styles.modalSubtitle}>
              {workoutComplete
                ? "Awesome work! You've completed today's session and locked in your streak. Keep the fire burning tomorrow!"
                : "You haven't trained yet today! Complete today's workout to keep your streak alive."}
            </Text>

            {/* Divider */}
            <View style={styles.modalDivider} />

            {/* Weekly Activity Row (Duolingo Style) */}
            <View style={styles.weekRow}>
              {getWeekDays().map((day) => {
                let badgeBg = Colors.surfaceAlt;
                let badgeBorder = Colors.border;
                let textColor = Colors.textSecondary;
                let showFlame = false;
                let isDashed = false;

                if (day.trained) {
                  badgeBg = Colors.brandPrimary;
                  badgeBorder = Colors.brandPrimary;
                  textColor = Colors.brandPrimary;
                  showFlame = true;
                } else if (day.isToday) {
                  badgeBg = Colors.brandLight;
                  badgeBorder = Colors.brandPrimary;
                  textColor = Colors.brandPrimary;
                  isDashed = true;
                } else if (day.isFuture) {
                  badgeBg = 'transparent';
                  badgeBorder = Colors.border;
                  textColor = Colors.textMuted;
                }

                return (
                  <View key={day.dateStr} style={styles.weekDayColumn}>
                    <Text
                      style={[
                        styles.weekDayLabel,
                        {
                          color: day.isToday ? Colors.brandPrimary : Colors.textSecondary,
                          fontFamily: day.isToday ? Typography.fontFamily.bold : Typography.fontFamily.medium,
                        },
                      ]}
                    >
                      {day.label}
                    </Text>
                    <View
                      style={[
                        styles.dayBadge,
                        {
                          backgroundColor: badgeBg,
                          borderColor: badgeBorder,
                          borderStyle: isDashed ? 'dashed' : 'solid',
                          borderWidth: isDashed ? 2 : 1.5,
                        },
                      ]}
                    >
                      {showFlame && <Flame size={16} color={Colors.textInverse} />}
                      {day.isToday && !day.trained && (
                        <View style={styles.todayInnerDot} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Streak Freeze Slot (Gamified Premium Slot) */}
            <View style={styles.freezeCard}>
              <View style={styles.freezeIconWrapper}>
                <Shield size={18} color="#1E88E5" />
              </View>
              <View style={styles.freezeTextWrapper}>
                <Text style={styles.freezeTitle}>Streak Freeze Equipped</Text>
                <Text style={styles.freezeSub}>Your streak is protected if you miss tomorrow.</Text>
              </View>
              <View style={styles.freezeCountBadge}>
                <Text style={styles.freezeCountText}>1/1</Text>
              </View>
            </View>

            {/* Smart Primary Call To Action Button */}
            <TouchableOpacity
              style={styles.modalCta}
              activeOpacity={0.85}
              onPress={() => {
                GameHaptics.correct();
                handleCloseModal();
                if (!workoutComplete) {
                  navigation.navigate('Train', { screen: 'ActiveSession' });
                }
              }}
            >
              <Text style={styles.modalCtaText}>
                {workoutComplete ? 'Awesome, Keep It Up!' : "Start Today's Workout"}
              </Text>
            </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* Dynamic Quick Check-in Bottom Sheet */}
        <CheckinBottomSheet
          visible={checkinSheetVisible}
          type={checkinSheetType}
          initialValue={checkinSheetRating}
          onClose={() => setCheckinSheetVisible(false)}
          onComplete={(val) => {
            setCheckinSheetVisible(false);
            handleComplete(checkinSheetType, val);
          }}
          Colors={Colors}
        />
      </View>
  );
}

const BRIEF_NAVY = '#1D2340';

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  stickyHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 44,
    backgroundColor: Colors.appBg,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stickyTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: Colors.brandPrimary,
  },
  scrollContent: { paddingHorizontal: Spacing[6] },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing[6],
    marginBottom: Spacing[6],
  },
  greeting: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    lineHeight: 38,
  },
  date: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brandLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  streakText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: Colors.brandPrimary,
  },
  scoreSection: { alignItems: 'center', marginBottom: Spacing[8] },
  // Problem 2: personal context replaces cohort comparison
  personalContextText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    marginTop: Spacing[4],
    textAlign: 'center',
  },
  section: { marginBottom: Spacing[6] },
  checkinRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    paddingRight: Spacing[6],
  },
  checkinWrapper: { gap: 8 },
  checkinSkip: { alignItems: 'center' },
  checkinSkipText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
  },
  domainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[4],
  },
  // Problem 7: dark navy brief card — distinct from amber insight card
  briefCard: {
    backgroundColor: BRIEF_NAVY,
    borderRadius: Radius.lg,
    padding: Spacing[6],
    marginBottom: Spacing[6],
    gap: Spacing[2],
  },
  briefLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: Typography.letterSpacing.wide,
  },
  // Problem 8: two-line headline, no em dash
  briefHeadline: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h3,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  briefSubhead: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: 'rgba(255,255,255,0.70)',
  },
  briefCTARow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  // Problem 7: amber CTA on dark navy — clear action signal
  briefCTA: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: Colors.brandPrimary,
  },
  sundayBanner: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: Radius.xl,
    padding: Spacing[5],
  },
  sundayBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sundayBannerLeft: { flex: 1 },
  sundayBannerTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
  sundayBannerSub: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  
  // ── Streak Modal Dashboard Styles ─────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(29, 27, 25, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[6],
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing[4],
    right: Spacing[4],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  flameContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  flameHalo: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.brandLight,
    opacity: 0.35,
  },
  flameInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 26,
    color: Colors.textPrimary,
    marginTop: Spacing[5],
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    marginTop: Spacing[2],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing[2],
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing[5],
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing[1],
  },
  weekDayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  weekDayLabel: {
    fontSize: Typography.size.caption - 1,
    marginBottom: Spacing[2],
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandPrimary,
  },
  freezeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: Radius.lg,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginTop: Spacing[6],
    width: '100%',
  },
  freezeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#BBDEFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  freezeTextWrapper: {
    flex: 1,
  },
  freezeTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.label,
    color: '#0D47A1',
  },
  freezeSub: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: '#1E88E5',
    marginTop: 1,
  },
  freezeCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  freezeCountText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: '#1565C0',
  },
  modalCta: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: Radius.full,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[6],
    width: '100%',
    minHeight: 48,
  },
  modalCtaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },
});
