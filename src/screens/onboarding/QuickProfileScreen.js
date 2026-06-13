import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Square, CheckSquare, Zap, Target, Shield, Search } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';
import { TouchableScale, FadeInUp } from '../../components/Motion';
import ScenicBackground from '../../shared/components/ScenicBackground';

const { width, height } = Dimensions.get('window');

const GOALS = [
  { id: 'sharpen', labelKey: 'onboarding.quickProfile.goal.sharpen', descKey: 'onboarding.quickProfile.goal.sharpen.desc', Icon: Zap },
  { id: 'focus', labelKey: 'onboarding.quickProfile.goal.focus', descKey: 'onboarding.quickProfile.goal.focus.desc', Icon: Target },
  { id: 'protect', labelKey: 'onboarding.quickProfile.goal.protect', descKey: 'onboarding.quickProfile.goal.protect.desc', Icon: Shield },
  { id: 'curious', labelKey: 'onboarding.quickProfile.goal.curious', descKey: 'onboarding.quickProfile.goal.curious.desc', Icon: Search },
];

export default function QuickProfileScreen({ navigation, route }) {
  const { dispatch } = useApp();
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const cognitiveScore = route?.params?.cognitiveScore || 715;

  const [name, setName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('focus');
  const [agreed, setAgreed] = useState(true);

  const handleContinue = () => {
    if (!name.trim() || !agreed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Save profiling & focus details
    dispatch({ type: 'SET_PROFILE', payload: { name: name.trim(), focusGoal: selectedGoal } });
    dispatch({ type: 'SET_INTENT', payload: selectedGoal });

    // Transition to Projection Screen
    navigation.navigate('Projection', { cognitiveScore });
  };

  const isFormValid = name.trim().length > 0 && agreed;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <ScenicBackground preset="onboarding" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <FadeInUp delay={100} distance={20}>
            <Text style={styles.headline}>{t('onboarding.quickProfile.headline')}</Text>
            <Text style={styles.subhead}>{t('onboarding.quickProfile.subtitle')}</Text>
          </FadeInUp>

          {/* Name Field */}
          <FadeInUp delay={250} distance={20} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('onboarding.quickProfile.nameLabel')}</Text>
            <TextInput
              style={[styles.inputCard, Shadow.sm]}
              placeholder={t('onboarding.quickProfile.placeholderName')}
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={20}
              returnKeyType="done"
            />
          </FadeInUp>

          {/* Goal Selector */}
          <FadeInUp delay={400} distance={20} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('onboarding.quickProfile.goalLabel')}</Text>
            <View style={styles.grid}>
              {GOALS.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalCard,
                      Shadow.sm,
                      isSelected && styles.goalSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedGoal(goal.id);
                    }}
                    activeOpacity={0.85}
                  >
                    <goal.Icon 
                      color={isSelected ? Colors.brandPrimary : Colors.textPrimary} 
                      size={24} 
                      style={{ marginBottom: 4 }} 
                    />
                    <Text style={[styles.goalLabel, isSelected && { color: Colors.brandPrimary }]}>
                      {t(goal.labelKey)}
                    </Text>
                    <Text style={styles.goalDesc}>
                      {t(goal.descKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FadeInUp>

          {/* Terms checkbox inside Profile Builder (where it belongs!) */}
          <FadeInUp delay={550} distance={20}>
            <TouchableOpacity 
              style={styles.checkboxRow} 
              activeOpacity={0.7}
              onPress={() => setAgreed(!agreed)}
            >
              {agreed ? (
                <CheckSquare color={Colors.brandPrimary} size={22} />
              ) : (
                <Square color={Colors.textMuted} size={22} />
              )}
              <Text style={styles.checkboxText}>
                {t('onboarding.quickProfile.termsAgreement')}
              </Text>
            </TouchableOpacity>
          </FadeInUp>

          {/* Action Zone */}
          <FadeInUp delay={650} distance={20} style={styles.actionZone}>
            <TouchableScale
              style={[styles.primaryButton, !isFormValid && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!isFormValid}
            >
              <Text style={styles.primaryButtonText}>{t('onboarding.quickProfile.saveAndContinue')}</Text>
            </TouchableScale>
          </FadeInUp>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: height > 800 ? 68 : 48,
    paddingBottom: Spacing[10],
    gap: Spacing[6],
  },
  headline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  subhead: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginTop: 6,
  },
  section: {
    gap: Spacing[3],
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: Spacing[5],
    fontSize: Typography.size.body,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  goalCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalSelected: {
    borderColor: Colors.brandPrimary,
    borderWidth: 2,
  },
  goalLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.label,
    color: Colors.textPrimary,
  },
  goalDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing[4],
    marginVertical: Spacing[2],
  },
  checkboxText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing[3],
    lineHeight: 18,
    flex: 1,
  },
  actionZone: {
    width: '100%',
    marginTop: Spacing[4],
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
    opacity: 0.6,
  },
});
