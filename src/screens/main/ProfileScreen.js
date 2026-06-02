import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { resetApp } from '../../store/actions';
import { clearAllStorage } from '../../services/storage';
import { useThemeColors, Typography, Spacing, Radius, Shadow, getDomains } from '../../theme';
import { useProfileStats } from '../../features/profile/hooks/useProfileStats';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { analytics } from '../../services/analyticsService';
import { t } from '../../constants/useStrings';

// ── SettingRow ─────────────────────────────────────────────────────────────
function SettingRow({ label, sub, value, onPress, isSwitch, switchValue, onSwitchChange }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getRowStyles(Colors), [Colors]);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={isSwitch ? 1 : 0.75}
      disabled={isSwitch || !onPress}
    >
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: Colors.border, true: Colors.brandPrimary }}
          thumbColor={Colors.surface}
        />
      ) : (
        <Text style={styles.value}>{value || (onPress ? '→' : '')}</Text>
      )}
    </TouchableOpacity>
  );
}

const getRowStyles = (Colors) => StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing[4], paddingHorizontal: Spacing[5],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  left: { flex: 1, marginRight: Spacing[3] },
  label: {
    fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.body,
    color: Colors.textPrimary, textTransform: 'lowercase',
  },
  sub: {
    fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption,
    color: Colors.textMuted, marginTop: 2,
  },
  value: {
    fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.body,
    color: Colors.textMuted,
  },
});

// ── Section ────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getSectionStyles(Colors), [Colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const getSectionStyles = (Colors) => StyleSheet.create({
  section: { marginBottom: Spacing[5] },
  title: {
    fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.caption,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: Spacing[2], paddingHorizontal: Spacing[1],
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
  },
});

// ── ProfileScreen ──────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { state, dispatch, logout } = useApp();
  const insets = useSafeAreaInsets();
  const { profile, domainScores } = state;
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const DOMAINS = getDomains(Colors);
  const { totalSessions, avgScore, streakDays } = useProfileStats();

  useEffect(() => {
    analytics.track('screen_viewed', { screenName: 'Profile' });
  }, []);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [weeklyBriefs, setWeeklyBriefs] = useState(true);

  // Focus areas: sort domain scores ascending so that the lowest (weakest) are listed first!
  const focusDomains = useMemo(() => {
    if (!domainScores) return DOMAINS.slice(0, 3);
    return [...DOMAINS]
      .sort((a, b) => (domainScores[a.id] || 0) - (domainScores[b.id] || 0))
      .slice(0, 3);
  }, [domainScores, DOMAINS]);

  // Map state profile options back to translated values
  const ageOptions = ['18–25', '26–35', '36–45', '46–55', '56–65', '65+'];
  const sleepOptions = ['under 5 hours', '5–6 hours', '6–7 hours', '7–8 hours', '8+ hours'];
  const activityOptions = ['rarely', 'a few times a week', 'most days', 'every day'];

  const ageIdx = ageOptions.indexOf(profile.ageRange);
  const sleepIdx = sleepOptions.indexOf(profile.avgSleepBucket);
  const activityIdx = activityOptions.indexOf(profile.activityLevel);

  const ageValue = ageIdx !== -1 ? t(`onboarding.quickProfile.ageOption.${ageIdx}`) : profile.ageRange || '26–35';
  const sleepValue = sleepIdx !== -1 ? t(`onboarding.quickProfile.sleepOption.${sleepIdx}`) : profile.avgSleepBucket || '7–8 hours';
  const activityValue = activityIdx !== -1 ? t(`onboarding.quickProfile.activityOption.${activityIdx}`) : profile.activityLevel || 'most days';
  const intentValue = state.intent ? t(`onboarding.intent.labels.${state.intent}`) : t('profile.goal.staySharp');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('profile.title')}</Text>

        {/* Stats card */}
        <View style={[styles.statsCard, Shadow.md]}>
          <View style={styles.statsRow}>
            {streakDays > 0 && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{streakDays}</Text>
                  <Text style={styles.statLabel}>{t('profile.streakLabel')}</Text>
                </View>
                <View style={styles.statDivider} />
              </>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalSessions}</Text>
              <Text style={styles.statLabel}>{t('profile.sessionsLabel')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{avgScore}</Text>
              <Text style={styles.statLabel}>{t('profile.avgScoreLabel')}</Text>
            </View>
          </View>
          
          <View style={styles.domainHighlights}>
            <Text style={styles.domainHighlightsLabel}>{t('profile.focusAreasLabel')}</Text>
            <View style={styles.domainHighlightsRow}>
              {focusDomains.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.domainHighlight, { backgroundColor: d.color.light }]}
                  onPress={() => navigation.navigate('Train', { initialFilter: d.id })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.domainHighlightDot, { backgroundColor: d.color.main }]} />
                  <Text style={[styles.domainHighlightName, { color: d.color.main }]}>{d.label}</Text>
                  {domainScores && (
                    <Text style={[styles.domainHighlightScore, { color: d.color.main }]}>
                      {domainScores[d.id] || 0}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Section title={t('profile.section.yourPlan')}>
          <SettingRow label={t('profile.setting.primaryGoal')} value={intentValue} />
          <SettingRow label={t('profile.setting.ageRange')} value={ageValue} />
          <SettingRow label={t('profile.setting.typicalSleep')} value={sleepValue} />
          <SettingRow label={t('profile.setting.activityLevel')} value={activityValue} />
        </Section>

        <Section title={t('profile.section.notifications')}>
          <SettingRow
            label={t('profile.setting.dailyReminder')}
            sub={t('profile.setting.dailyReminderSub')}
            isSwitch
            switchValue={dailyReminders}
            onSwitchChange={setDailyReminders}
          />
          <SettingRow
            label={t('profile.setting.weeklyBrief')}
            sub={t('profile.setting.weeklyBriefSub')}
            isSwitch
            switchValue={weeklyBriefs}
            onSwitchChange={setWeeklyBriefs}
          />
        </Section>

        <Section title={t('profile.section.account')}>
          <SettingRow
            label={t('profile.setting.logout')}
            value="→"
            onPress={() => setShowLogoutConfirm(true)}
          />
        </Section>

        <Section title={t('profile.section.about')}>
          <SettingRow label={t('profile.setting.version')} value="1.0.0" />
        </Section>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setShowResetConfirm(true)}
        >
          <Text style={styles.resetBtnText}>{t('profile.restartOnboarding')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Customized Warning Modal instead of standard Alert.alert */}
      <ConfirmModal
        visible={showResetConfirm}
        title={t('profile.resetConfirm.title')}
        body={t('profile.resetConfirm.body')}
        onConfirm={() => {
          dispatch(resetApp());
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
        Colors={Colors}
      />

      <ConfirmModal
        visible={showLogoutConfirm}
        title={t('profile.logoutConfirm.title')}
        body={t('profile.logoutConfirm.body')}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
        Colors={Colors}
        confirmText={t('profile.logoutConfirm.confirm')}
      />
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  content: { paddingHorizontal: Spacing[6] },
  title: {
    fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.size.h1,
    color: Colors.textPrimary,
    marginTop: Spacing[2], marginBottom: Spacing[5],
  },
  statsCard: {
    backgroundColor: Colors.brandPrimary, borderRadius: Radius.xl,
    padding: Spacing[6], marginBottom: Spacing[5],
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing[5] },
  statItem: { alignItems: 'center', gap: 4, flex: 1 },
  statNum: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.size.h1, color: Colors.textInverse, textAlign: 'center' },
  statLabel: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption, color: 'rgba(255,255,255,0.7)', textTransform: 'lowercase', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', height: 36, alignSelf: 'center' },
  domainHighlights: { gap: Spacing[2] },
  domainHighlightsLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.caption, color: 'rgba(255,255,255,0.6)', textTransform: 'lowercase' },
  domainHighlightsRow: { flexDirection: 'row', gap: Spacing[2] },
  domainHighlight: { flex: 1, borderRadius: Radius.md, padding: Spacing[3], gap: 2 },
  domainHighlightDot: { width: 6, height: 6, borderRadius: 3 },
  domainHighlightName: { fontFamily: Typography.fontFamily.medium, fontSize: 10, textTransform: 'lowercase' },
  domainHighlightScore: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.label },
  resetBtn: { alignSelf: 'center', paddingVertical: Spacing[3], paddingHorizontal: Spacing[5], marginBottom: Spacing[4] },
  resetBtnText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption, color: Colors.textMuted, textTransform: 'lowercase' },
});
