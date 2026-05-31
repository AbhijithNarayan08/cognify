import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Zap, Target, Shield, Search } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';

const INTENTS = [
  { id: 'sharpen', label: 'stay sharp',       desc: 'keep your edge in work and life',    Icon: Zap },
  { id: 'focus',   label: 'build focus',       desc: 'train deeper, longer concentration', Icon: Target },
  { id: 'protect', label: 'protect my memory', desc: 'invest in your long-term brain health', Icon: Shield },
  { id: 'curious', label: 'just curious',      desc: 'explore what cognitive fitness means', Icon: Search },
];

export default function IntentScreen({ navigation }) {
  const { dispatch } = useApp();
  const [selected, setSelected] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, []);

  const handleSelect = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
    dispatch({ type: 'SET_INTENT', payload: id });
    setTimeout(() => navigation.navigate('QuickProfile'), 500);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.headline}>{t('onboarding.intent.headline')}</Text>
        <Text style={styles.subhead}>{t('onboarding.intent.subhead')}</Text>
      </View>

      <View style={styles.grid}>
        {INTENTS.map((intent) => {
          const isSelected = selected === intent.id;
          return (
            <TouchableOpacity
              key={intent.id}
              style={[
                styles.card,
                Shadow.sm,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => handleSelect(intent.id)}
              activeOpacity={0.85}
            >
              <intent.Icon 
                color={isSelected ? Colors.brandPrimary : Colors.textPrimary} 
                size={28} 
                style={{ marginBottom: 4 }} 
              />
              <Text style={[styles.cardLabel, isSelected && { color: Colors.brandPrimary }]}>
                {t('onboarding.intent.labels.' + intent.id)}
              </Text>
              <Text style={styles.cardDesc}>
                {t('onboarding.intent.descriptions.' + intent.id)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
    paddingHorizontal: Spacing[6],
    paddingTop: 72,
  },
  header: {
    marginBottom: Spacing[8],
  },
  headline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    textTransform: 'lowercase',
    marginBottom: Spacing[2],
    lineHeight: 36,
  },
  subhead: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  card: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[5],
    gap: Spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: Colors.brandPrimary,
    borderWidth: 2,
  },
  cardLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.label,
    color: Colors.textPrimary,
    textTransform: 'lowercase',
  },
  cardDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
