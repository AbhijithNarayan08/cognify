import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Frown, Meh, Smile, Laugh,
  BedDouble, Footprints, Wind, Dumbbell, Activity,
} from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';

// ── Lucide icon sets per check-in type ──────────────────────────────────────

// Sleep & mood: continuous emotional icon scale using Lucide face icons
// Frown → Frown (softer) → Meh → Smile → Laugh
// Lucide doesn't have a "slight frown" so we use two Frown sizes with diff colours
const SLEEP_OPTIONS = [
  { Icon: Frown,  label: 'terrible', value: 0 },
  { Icon: Frown,  label: 'poor',     value: 1 },  // same icon, lighter colour
  { Icon: Meh,   label: 'ok',       value: 2 },
  { Icon: Smile, label: 'good',     value: 3 },
  { Icon: Laugh, label: 'great',    value: 4 },
];

const MOOD_OPTIONS = [
  { Icon: Frown,  label: 'terrible', value: 0 },
  { Icon: Frown,  label: 'poor',     value: 1 },
  { Icon: Meh,   label: 'ok',       value: 2 },
  { Icon: Smile, label: 'good',     value: 3 },
  { Icon: Laugh, label: 'great',    value: 4 },
];

// Activity: contextual Lucide icons for each intensity level
const ACTIVITY_OPTIONS = [
  { Icon: BedDouble,  label: 'rest',  value: 0 },
  { Icon: Footprints, label: 'walk',  value: 1 },
  { Icon: Wind,       label: 'run',   value: 2 },
  { Icon: Dumbbell,   label: 'gym',   value: 3 },
  { Icon: Activity,   label: 'sport', value: 4 },
];

// Per-type tint colours for selection highlight
const CHECKIN_CONFIGS = {
  sleep: {
    titleKey: 'home.checkin.sleep.title',
    options: SLEEP_OPTIONS,
    tintColor: '#3A6EEA',
    tintBg: 'rgba(58,110,234,0.12)',
  },
  activity: {
    titleKey: 'home.checkin.activity.title',
    options: ACTIVITY_OPTIONS,
    tintColor: '#3DC27A',
    tintBg: 'rgba(61,194,122,0.12)',
  },
  mood: {
    titleKey: 'home.checkin.mood.title',
    options: MOOD_OPTIONS,
    tintColor: '#FF7DB4',
    tintBg: 'rgba(255,125,180,0.12)',
  },
};

/**
 * CheckinCard — compact horizontal daily check-in using Lucide icons.
 * Layout: single card ≤120pt tall, 5 options in a horizontal row.
 * @param {{ type: 'sleep'|'activity'|'mood', onComplete: (value: number) => void }} props
 */
export function CheckinCard({ type, onComplete }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const [selected, setSelected] = useState(null);

  const config = CHECKIN_CONFIGS[type];
  if (!config) return null;

  const handleSelect = (opt) => {
    setSelected(opt.value);
    setTimeout(() => onComplete(opt.value), 300);
  };

  // Icon colour: ramp from muted → tint as scale goes up
  // For face icons, 'poor' (value 1) gets a slightly lighter shade than 'terrible' (value 0)
  const getIconColor = (opt, isSelected) => {
    if (isSelected) return config.tintColor;
    // Unselected: distribute across muted → secondary
    const ramp = ['#C0C8D8', '#A8B4C8', '#8899AA', '#6688AA', '#4A5568'];
    return ramp[opt.value] || Colors.textMuted;
  };

  return (
    <View style={[styles.card, Shadow.sm]}>
      <Text style={styles.title}>{t(config.titleKey)}</Text>
      <View style={styles.options}>
        {config.options.map((opt) => {
          const isSelected = selected === opt.value;
          const iconColor = getIconColor(opt, isSelected);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.option,
                isSelected && { backgroundColor: config.tintBg, borderRadius: Radius.sm },
              ]}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.7}
            >
              <opt.Icon size={24} color={iconColor} strokeWidth={isSelected ? 2.5 : 1.8} />
              <Text style={[
                styles.optionLabel,
                isSelected && { color: config.tintColor, fontFamily: Typography.fontFamily.semiBold },
              ]}>
                {t('home.checkin.option.' + opt.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
    minWidth: 320,
  },
  title: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing[3],
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 56,
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 5,
  },
  optionLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.micro,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
