// src/features/train/screens/TrainScreen.js
import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../../theme';
import { ExerciseCard } from '../../../shared/components/ExerciseCard';
import { FadeInUp, TouchableScale } from '../../../shared/motion/Motion';
import { useExerciseFilter } from '../hooks/useExerciseFilter';
import { useApp } from '../../../context/AppContext';
import { t } from '../../../constants/useStrings';
import { exerciseService } from '../../../services/exerciseService';
import { analytics } from '../../../services/analyticsService';
import { GameHaptics } from '../../../utils/haptics';
import { DynamicStar } from '../../../shared/components/MascotCharacters';

const { width } = Dimensions.get('window');

export function TrainScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const { filters, filteredExercises, activeFilter, setActiveFilter, DOMAINS } = useExerciseFilter();
  const [dailyWorkout, setDailyWorkout] = useState([]);
  const [showDifficultyTooltip, setShowDifficultyTooltip] = useState(false);

  useEffect(() => {
    analytics.track('screen_viewed', { screenName: 'Train' });
    
    // Check difficulty dots tutorial popover status
    AsyncStorage.getItem('cognify:tutorial:difficultyDots').then((val) => {
      if (!val) {
        setShowDifficultyTooltip(true);
      }
    });
  }, []);

  useEffect(() => {
    const { initialFilter } = route?.params ?? {};
    if (initialFilter) {
      setActiveFilter(initialFilter);
      navigation.setParams({ initialFilter: null });
    }
  }, [route?.params?.initialFilter]);

  useEffect(() => {
    const playAgainEx = route?.params?.playAgainExercise;
    const nextEx = route?.params?.nextExercise;
    const remainingEx = route?.params?.remainingExercises;

    if (playAgainEx) {
      // Clear parameters immediately to prevent loops on hot-reloading or back navigation
      navigation.setParams({ playAgainExercise: null });

      // Clean transition: navigate after a brief timeout to let the previous modal slide down completely
      const timer = setTimeout(() => {
        navigation.navigate('ActiveSession', {
          singleExercise: playAgainEx,
        });
      }, 150);
      return () => clearTimeout(timer);
    } else if (nextEx) {
      // Clear parameters immediately to prevent loops on hot-reloading or back navigation
      navigation.setParams({ nextExercise: null, remainingExercises: null });

      // Clean transition: navigate after a brief timeout to let the previous modal slide down completely
      const timer = setTimeout(() => {
        navigation.navigate('ActiveSession', {
          singleExercise: nextEx,
          remainingExercises: remainingEx,
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [route?.params?.playAgainExercise, route?.params?.nextExercise, route?.params?.remainingExercises]);

  useEffect(() => {
    let active = true;
    exerciseService.getDailyWorkout().then(workout => {
      if (active) setDailyWorkout(workout);
    });
    return () => { active = false; };
  }, []);

  const dismissDifficultyTooltip = () => {
    setShowDifficultyTooltip(false);
    AsyncStorage.setItem('cognify:tutorial:difficultyDots', 'true');
  };

  const renderExercise = ({ item, index }) => (
    <FadeInUp delay={200 + index * 50} style={styles.exerciseCardWrapper}>
      <ExerciseCard
        exercise={item}
        locked={index > 2 && !state.onboardingComplete}
        onPress={() => navigation.navigate('ActiveSession', { singleExercise: item })}
        showTooltip={index === 0 && showDifficultyTooltip}
        onDismissTooltip={dismissDifficultyTooltip}
      />
    </FadeInUp>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('train.title')}</Text>
      </View>

      {/* Filter pills with horizontal scroll right fade */}
      <View style={styles.filterScrollViewContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map(f => {
            const domain = DOMAINS.find(d => d.id === f);
            const isActive = activeFilter === f;
            
            let pillBg = Colors.surfaceAlt;
            let pillBorder = Colors.border;
            let textCol = Colors.textSecondary;
            let textWeight = Typography.fontFamily.medium;

            if (isActive) {
              if (f === 'all') {
                pillBg = Colors.brandPrimary;
                pillBorder = Colors.brandPrimary;
                textCol = Colors.textInverse;
                textWeight = Typography.fontFamily.bold;
              } else {
                pillBg = domain?.color.light || Colors.brandLight;
                pillBorder = domain?.color.main || Colors.brandPrimary;
                textCol = domain?.color.main || Colors.brandPrimary;
                textWeight = Typography.fontFamily.bold;
              }
            }

            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: pillBg,
                    borderColor: pillBorder,
                    minHeight: 44 
                  }
                ]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, { color: textCol, fontFamily: textWeight }]}>
                  {f === 'all' ? t('train.filter.all') : (domain?.label ? domain.label.charAt(0).toUpperCase() + domain.label.slice(1) : f)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <LinearGradient
          colors={['rgba(249, 244, 242, 0)', Colors.appBg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightFadeGradient}
          pointerEvents="none"
        />
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={item => item.id}
        renderItem={renderExercise}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        removeClippedSubviews
        ListHeaderComponent={
          activeFilter === 'all' ? (
            <>
              <FadeInUp delay={100}>
                <TouchableScale
                  style={[styles.workoutBanner, Shadow.md]}
                  scaleTo={0.97}
                  onPress={() => {
                    GameHaptics.correct(); // Light haptic feedback
                    navigation.navigate('ActiveSession');
                  }}
                >
                  <View style={{ flex: 1, paddingRight: Spacing[3] }}>
                    <Text style={styles.bannerLabel}>{t('train.todayWorkout')}</Text>
                    <Text style={styles.bannerTitle}>
                      {t('train.workoutStats', { count: dailyWorkout.length })}
                    </Text>
                    <View style={styles.bannerChips}>
                      {dailyWorkout.map(e => {
                        const d = DOMAINS.find(dom => dom.id === e.domain);
                        const labelText = d?.label ? d.label.charAt(0).toUpperCase() + d.label.slice(1) : '';
                        return (
                          <View key={e.id} style={[styles.bannerChip, { backgroundColor: d?.color.light }]}>
                            <Text style={[styles.bannerChipText, { color: d?.color.main }]}>{labelText}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={styles.bannerButton}>
                      <Text style={styles.bannerButtonText}>{t('train.activeSession.start')}</Text>
                      <ArrowRight size={16} color={Colors.textInverse} style={{ marginLeft: 6 }} />
                    </View>
                  </View>
                  
                  {/* Right Side: Tactile animated Energy Star Mascot */}
                  <View style={styles.bannerMascotContainer}>
                    <DynamicStar size={168} />
                  </View>
                </TouchableScale>
              </FadeInUp>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                  {t('train.allExercises') || 'All Exercises'}
                </Text>
                <Text style={styles.sectionHeaderCount}>
                  {t('train.exerciseCount', { count: filteredExercises.length })}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>
                {t('train.domainExercises', { domain: (() => {
                  const activeDomain = DOMAINS.find(dom => dom.id === activeFilter);
                  return activeDomain?.label ? activeDomain.label.charAt(0).toUpperCase() + activeDomain.label.slice(1) : activeFilter;
                })() })}
              </Text>
              <Text style={styles.sectionHeaderCount}>
                {t('train.exerciseCount', { count: filteredExercises.length })}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[3] },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
  },
  
  // Filter pills
  filterScrollViewContainer: {
    position: 'relative',
    width: '100%',
  },
  filterRow: {
    paddingHorizontal: Spacing[6],
    gap: Spacing[2],
    paddingBottom: Spacing[4],
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minWidth: 64,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: Typography.size.caption,
  },
  rightFadeGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 44,
    zIndex: 10,
  },

  // Grid
  grid: { 
    paddingHorizontal: Spacing[6], 
    paddingBottom: 100, // Breathing space at the bottom to avoid cut-off
  },
  row: { 
    justifyContent: 'space-between', 
    marginBottom: Spacing[3],
    alignItems: 'stretch', // Stretches ExerciseCards to equal heights
  },
  exerciseCardWrapper: { 
    width: (width - 48 - 12) / 2,
    flex: 1,
  },

  // Workout banner
  workoutBanner: {
    backgroundColor: '#1A1816', // Approach B: warm near-black premium background
    borderRadius: Radius.xl,
    padding: Spacing[6],
    marginBottom: Spacing[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerMascotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing[2],
  },
  bannerLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  bannerTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h2,
    color: Colors.textInverse,
  },
  bannerChips: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: Spacing[2], 
    marginTop: Spacing[3],
  },
  bannerChip: {
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bannerChipText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brandPrimary, // brandPrimary orange background
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.full,
    marginTop: Spacing[4],
    alignSelf: 'flex-start',
    minHeight: 44, // WCAG touch target size compliance
  },
  bannerButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: Colors.textInverse,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing[2],
    marginBottom: Spacing[4],
    marginTop: Spacing[4],
  },
  sectionHeaderTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h2,
    color: Colors.textPrimary,
  },
  sectionHeaderCount: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
  },
});
