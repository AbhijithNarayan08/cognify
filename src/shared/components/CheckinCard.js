import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';
import { DynamicStar, DynamicMoon, DynamicSun } from './MascotCharacters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CHECKIN_CONFIGS = {
  sleep: {
    titleKey: 'home.checkin.sleep.title',
  },
  activity: {
    titleKey: 'home.checkin.activity.title',
  },
  mood: {
    titleKey: 'home.checkin.mood.title',
  },
};

/**
 * CheckinCard — A premium, unified full-width entry banner for logging lifestyle habits.
 * @param {{ type: 'sleep'|'activity'|'mood', onComplete: (value: number) => void }} props
 */
export function CheckinCard({ type, onComplete }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const config = CHECKIN_CONFIGS[type];
  if (!config) return null;

  return (
    <TouchableOpacity
      style={[styles.card, Shadow.sm]}
      onPress={() => onComplete(2)}
      activeOpacity={0.9}
    >
      <View style={styles.cardContent}>
        {/* Left Dynamic Mascot Character */}
        <View style={styles.mascotWrapper}>
          {type === 'sleep' && <DynamicMoon size={96} />}
          {type === 'activity' && <DynamicStar size={96} />}
          {type === 'mood' && <DynamicSun size={96} />}
        </View>

        {/* Center Informational Zone */}
        <View style={styles.textZone}>
          <Text style={styles.title}>{t(config.titleKey)}</Text>
          <Text style={styles.subtitle}>{t('home.checkin.cardSubtitle')}</Text>
        </View>

        {/* Right Arrow CTA */}
        <View style={styles.rightZone}>
          <ChevronRight size={20} color={Colors.textMuted} strokeWidth={2.5} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    width: SCREEN_WIDTH - Spacing[6] * 2, // fills available screen width inside margins
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mascotWrapper: {
    marginRight: Spacing[4],
  },
  textZone: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h3,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  rightZone: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: Spacing[2],
  },
});
