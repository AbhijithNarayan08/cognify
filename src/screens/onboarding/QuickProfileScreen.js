import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Square, CheckSquare, Zap, Target, Shield, Search } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { t } from '../../constants/useStrings';
import { TouchableScale, FadeInUp } from '../../components/Motion';

const { width, height } = Dimensions.get('window');

const GOALS = [
  { id: 'sharpen', label: 'stay sharp', desc: 'keep your edge in work and life', Icon: Zap },
  { id: 'focus', label: 'build focus', desc: 'train deeper, longer concentration', Icon: Target },
  { id: 'protect', label: 'protect memory', desc: 'invest in your long-term brain health', Icon: Shield },
  { id: 'curious', label: 'just curious', desc: 'explore cognitive training', Icon: Search },
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <FadeInUp delay={100} distance={20}>
            <Text style={styles.headline}>make it yours.</Text>
            <Text style={styles.subhead}>set up your training profile to personalize your daily cognitive workout.</Text>
          </FadeInUp>

          {/* Name Field */}
          <FadeInUp delay={250} distance={20} style={styles.section}>
            <Text style={styles.sectionLabel}>your name</Text>
            <TextInput
              style={[styles.inputCard, Shadow.sm]}
              placeholder="e.g. Alex"
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
            <Text style={styles.sectionLabel}>your focus goal</Text>
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
                      {goal.label}
                    </Text>
                    <Text style={styles.goalDesc}>
                      {goal.desc}
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
                i agree to the terms of service and daily habit calibration.
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
              <Text style={styles.primaryButtonText}>save & continue</Text>
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
    backgroundColor: Colors.appBg,
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
    textTransform: 'lowercase',
    lineHeight: 36,
  },
  subhead: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginTop: 6,
    textTransform: 'lowercase',
  },
  section: {
    gap: Spacing[3],
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.caption,
    color: Colors.textMuted,
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
    textTransform: 'lowercase',
  },
  goalDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
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
    textTransform: 'lowercase',
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
    opacity: 0.6,
  },
});
