import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Alert } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useThemeColors, Typography, Spacing, Radius } from '../../theme';
import { t } from '../../constants/useStrings';
import { TouchableScale, FadeInUp } from '../../components/Motion';
import { DynamicMoon } from '../../shared/components/MascotCharacters';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function NotificationOptInScreen({ navigation, route }) {
  const { dispatch } = useApp();
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const cognitiveScore = route?.params?.cognitiveScore || 715;

  const handleComplete = () => {
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      payload: { cognitiveScore }
    });
    navigation.replace('MainApp');
  };

  const handleEnable = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('onboarding.notifications.alert.title'),
      t('onboarding.notifications.alert.body'),
      [
        {
          text: t('onboarding.notifications.skip'),
          onPress: handleComplete,
          style: "cancel"
        },
        {
          text: t('onboarding.notifications.alert.allow'),
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleComplete();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Graphic Zone with breathing Sleepy Moon Mascot */}
      <View style={styles.topGraphic}>
        <FadeInUp delay={200} distance={30} style={styles.mascotContainer}>
          <DynamicMoon size={140} />
        </FadeInUp>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        <FadeInUp delay={400} distance={20}>
          <Text style={styles.headline}>{t('onboarding.notifications.headline')}</Text>
          <Text style={styles.body}>
            {t('onboarding.notifications.body')}
          </Text>
        </FadeInUp>

        {/* Action Buttons */}
        <FadeInUp delay={600} distance={20} style={styles.actions}>
          <TouchableScale style={styles.primaryButton} onPress={handleEnable}>
            <Text style={styles.primaryText}>{t('onboarding.notifications.enable')}</Text>
          </TouchableScale>

          <TouchableScale style={styles.secondaryButton} onPress={handleComplete}>
            <Text style={styles.secondaryText}>{t('onboarding.notifications.skip')}</Text>
          </TouchableScale>
        </FadeInUp>
      </View>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2340', // Headspace Navy — dark and calm
  },
  topGraphic: {
    height: height * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
    justifyContent: 'space-between',
  },
  headline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing[3],
    lineHeight: 38,
  },
  body: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: '#A0B0C0', // Soft light gray (high contrast)
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing[4],
  },
  actions: {
    width: '100%',
    gap: Spacing[3],
    marginTop: Spacing[6],
  },
  primaryButton: {
    backgroundColor: '#3A6EEA', // Headspace Blue
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.body,
    color: '#A0B0C0',
  },
});
