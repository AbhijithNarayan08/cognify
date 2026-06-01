import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Spacing, Radius, Typography } from '../../theme';
import { TouchableScale } from '../../components/Motion';

const { width } = Dimensions.get('window');

export default function LoginForm({
  visible = false,
  onLoginSubmit,
  onTermsPress,
  onPrivacyPress,
  Colors
}) {
  const [formPhase, setFormPhase] = useState('entry'); // 'entry' | 'sso' | 'email'
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [email, setEmail] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);

  // Separate animation nodes to handle transition between phases safely on native thread
  const entryAnim = useRef(new Animated.Value(0)).current;
  const ssoAnim = useRef(new Animated.Value(0)).current;
  const emailAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (formPhase === 'entry') {
        Animated.timing(ssoAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
        Animated.timing(emailAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
        
        Animated.timing(entryAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      } else if (formPhase === 'sso') {
        Animated.timing(entryAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
        Animated.timing(emailAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
        
        Animated.timing(ssoAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      } else if (formPhase === 'email') {
        Animated.timing(entryAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
        Animated.timing(ssoAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
        
        Animated.timing(emailAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    } else {
      // Reset everything when hidden
      Animated.timing(entryAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      Animated.timing(ssoAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      Animated.timing(emailAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      setFormPhase('entry');
      setTermsAgreed(false);
      setTermsError(false);
      setEmail('');
      setEmailError(null);
    }
  }, [visible, formPhase]);

  // Smooth slide out then change phase transition
  const transitionTo = (newPhase) => {
    const activeAnim = formPhase === 'entry' ? entryAnim : formPhase === 'sso' ? ssoAnim : emailAnim;
    
    Animated.timing(activeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setFormPhase(newPhase);
    });
  };

  const handleCreateAccountPress = () => {
    if (!termsAgreed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTermsError(true);
      return;
    }
    transitionTo('sso');
  };

  const handleLogInPress = () => {
    if (!termsAgreed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTermsError(true);
      return;
    }
    transitionTo('email');
  };

  const handleAppleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setEmailError(null);
    setTimeout(() => {
      setLoading(false);
      if (onLoginSubmit) onLoginSubmit('apple');
    }, 1200);
  };

  const handleGoogleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setEmailError(null);
    setTimeout(() => {
      setLoading(false);
      if (onLoginSubmit) onLoginSubmit('google');
    }, 1200);
  };

  const handleEmailSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setEmailError('please enter a valid email address');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setEmailError(null);
    
    setTimeout(() => {
      setLoading(false);
      if (onLoginSubmit) onLoginSubmit('email', email.trim());
    }, 1500);
  };

  // Interpolated Styles for smooth transitions
  const entryStyle = {
    opacity: entryAnim,
    transform: [{
      translateY: entryAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [24, 0]
      })
    }],
    width: '100%',
    alignItems: 'center',
    display: formPhase === 'entry' ? 'flex' : 'none'
  };

  const ssoStyle = {
    opacity: ssoAnim,
    transform: [{
      translateY: ssoAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [24, 0]
      })
    }],
    width: '100%',
    alignItems: 'center',
    display: formPhase === 'sso' ? 'flex' : 'none'
  };

  const emailStyle = {
    opacity: emailAnim,
    transform: [{
      translateY: emailAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [24, 0]
      })
    }],
    width: '100%',
    alignItems: 'center',
    display: formPhase === 'email' ? 'flex' : 'none'
  };

  const styles = useMemo(() => getStyles(Colors), [Colors]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <View style={styles.formContainer}>

        {/* ======================================================== */}
        {/* PHASE 1: ENTRY OPTIONS                                   */}
        {/* ======================================================== */}
        <Animated.View style={entryStyle}>
          {/* Header & Subtitle */}
          <Text style={styles.title}>welcome to cognify</Text>
          <Text style={styles.subtitle}>train your mind. every day.</Text>

          {/* Custom Interactive Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTermsAgreed(!termsAgreed);
              if (termsError) setTermsError(false);
            }}
          >
            <View style={[
              styles.checkboxBox,
              termsAgreed && styles.checkboxBoxChecked,
              termsError && styles.checkboxBoxError
            ]}>
              {termsAgreed && (
                <View style={styles.checkboxCheck}>
                  <Svg width={10} height={8} viewBox="0 0 10 8">
                    <Path d="M1 4l2.5 2.5L9 1" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                </View>
              )}
            </View>
            <Text style={styles.checkboxText}>
              I agree to Cognify's{' '}
              <Text style={styles.checkboxLink} onPress={onTermsPress}>
                Terms & Conditions
              </Text>{' '}
              and acknowledge the{' '}
              <Text style={styles.checkboxLink} onPress={onPrivacyPress}>
                Privacy Policy
              </Text>.
            </Text>
          </TouchableOpacity>

          {/* Action CTAs */}
          <TouchableScale
            style={styles.createAccountBtn}
            onPress={handleCreateAccountPress}
          >
            <Text style={styles.createAccountBtnText}>create an account</Text>
          </TouchableScale>

          <TouchableScale
            style={styles.loginBtn}
            onPress={handleLogInPress}
          >
            <Text style={styles.loginBtnText}>log in</Text>
          </TouchableScale>
        </Animated.View>

        {/* ======================================================== */}
        {/* PHASE 2: SSO BUTTONS (GOOGLE & APPLE)                    */}
        {/* ======================================================== */}
        <Animated.View style={ssoStyle}>
          {/* Back Arrow */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              transitionTo('entry');
            }}
          >
            <Text style={styles.backBtnText}>← back to options</Text>
          </TouchableOpacity>

          <Text style={styles.ssoTitle}>choose account</Text>

          {/* Apple SSO Button */}
          <TouchableScale
            style={styles.ssoButton}
            onPress={handleAppleLogin}
            disabled={loading}
          >
            <View style={styles.ssoContent}>
              <Svg width={20} height={20} viewBox="0 0 20 20" style={styles.ssoIcon}>
                <Path
                  d="M16.2 11.2c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8s-1.9-.7-3.1-.7c-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.3 1.1-.1 1.6-.7 3-.7 1.3 0 1.8.7 2.9.7 1.2 0 2-.1 2.8-1.2.9-1.3 1.3-2.6 1.3-2.7-.1-.1-2.2-.8-2.2-3.3zM14.3 3.6c.6-.8 1-1.9.9-3-.9.1-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.9-1.3z"
                  fill="#2D3139"
                />
              </Svg>
              <Text style={styles.ssoButtonText}>continue with Apple</Text>
            </View>
          </TouchableScale>

          {/* Google SSO Button */}
          <TouchableScale
            style={[styles.ssoButton, { marginTop: Spacing[3] }]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={styles.ssoContent}>
              <Svg width={20} height={20} viewBox="0 0 48 48" style={styles.ssoIcon}>
                <Path
                  d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.1-6.1C34.6 4.9 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11 0 21-8 21-21 0-1.4-.2-2.7-.5-4z"
                  fill="#4285F4"
                />
              </Svg>
              <Text style={styles.ssoButtonText}>continue with Google</Text>
            </View>
          </TouchableScale>
        </Animated.View>

        {/* ======================================================== */}
        {/* PHASE 3: EMAIL FORM INPUT                                */}
        {/* ======================================================== */}
        <Animated.View style={emailStyle}>
          {/* Back Arrow */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              transitionTo('entry');
            }}
          >
            <Text style={styles.backBtnText}>← back to options</Text>
          </TouchableOpacity>

          <Text style={styles.ssoTitle}>email login</Text>

          {/* Email Text Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                inputFocused && styles.inputFocused,
                emailError && styles.inputError
              ]}
              placeholder="enter your email address"
              placeholderTextColor="#8A8E94"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                if (emailError) setEmailError(null);
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              editable={!loading}
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          {/* Continue with Email CTA */}
          <TouchableScale
            style={styles.emailSubmitBtn}
            onPress={handleEmailSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.emailSubmitBtnText}>continue with email</Text>
            )}
          </TouchableScale>
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  keyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: Spacing[6],
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 28,
    color: '#2D3139',
    textAlign: 'center',
    marginBottom: Spacing[2],
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 15,
    color: '#60646D',
    textAlign: 'center',
    marginBottom: Spacing[5],
    textTransform: 'lowercase',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[1],
    width: '100%',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#A0A4AC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  checkboxBoxError: {
    borderColor: '#FF5E5B',
  },
  checkboxCheck: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: '#60646D',
    marginLeft: Spacing[3],
    lineHeight: 18,
    flex: 1,
  },
  checkboxLink: {
    fontFamily: Typography.fontFamily.semiBold,
    color: '#0066FF',
  },
  createAccountBtn: {
    backgroundColor: '#0066FF', // Vibrant Headspace Blue
    borderRadius: Radius.full,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  createAccountBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  loginBtn: {
    backgroundColor: '#FAF2EE', // Creamy Headspace Pink/Beige
    borderRadius: Radius.full,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  loginBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#2D3139',
    textTransform: 'lowercase',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing[2],
    marginBottom: Spacing[4],
  },
  backBtnText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 14,
    color: '#60646D',
    textTransform: 'lowercase',
  },
  ssoTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 22,
    color: '#2D3139',
    alignSelf: 'flex-start',
    marginBottom: Spacing[4],
    textTransform: 'lowercase',
  },
  ssoButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2D3139',
    borderWidth: 1.5,
    borderRadius: Radius.full,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ssoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoIcon: {
    marginRight: Spacing[3],
  },
  ssoButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#2D3139',
    textTransform: 'lowercase',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: Spacing[4],
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'transparent',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 52,
    width: '100%',
    paddingHorizontal: Spacing[4],
    fontFamily: Typography.fontFamily.regular,
    fontSize: 15,
    color: '#2D3139',
  },
  inputFocused: {
    borderColor: '#0066FF',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF5E5B',
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: '#FF5E5B',
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingLeft: Spacing[2],
    textTransform: 'lowercase',
  },
  emailSubmitBtn: {
    backgroundColor: '#0066FF',
    borderRadius: Radius.full,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailSubmitBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
});
