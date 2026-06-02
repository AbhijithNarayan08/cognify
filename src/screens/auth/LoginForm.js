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
import { Eye, EyeOff } from 'lucide-react-native';
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
  const [isSignUp, setIsSignUp] = useState(false); // Email signup vs login toggle
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  
  const [inputFocused, setInputFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [authError, setAuthError] = useState(null);

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
      setIsSignUp(false);
      setTermsAgreed(false);
      setTermsError(false);
      setEmail('');
      setPassword('');
      setSecureText(true);
      setEmailError(null);
      setAuthError(null);
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
      setAuthError(null);
    });
  };

  const handleCreateAccountPress = () => {
    if (!termsAgreed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTermsError(true);
      return;
    }
    setIsSignUp(true);
    transitionTo('sso');
  };

  const handleLogInPress = () => {
    if (!termsAgreed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTermsError(true);
      return;
    }
    setIsSignUp(false);
    transitionTo('email');
  };

  const handleAppleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setAuthError(null);
    try {
      if (onLoginSubmit) {
        await onLoginSubmit('apple');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAuthError(err.message || 'Apple sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setAuthError(null);
    try {
      if (onLoginSubmit) {
        await onLoginSubmit('google');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAuthError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setEmailError('please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAuthError('password must be at least 6 characters');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setEmailError(null);
    setAuthError(null);
    
    try {
      if (onLoginSubmit) {
        await onLoginSubmit('email', { email: email.trim(), password, isSignUp });
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let errMsg = err.message || 'an error occurred. please try again.';
      // Custom mapping for Firebase Auth error codes
      if (err.code === 'auth/wrong-password') {
        errMsg = 'incorrect password. please try again.';
      } else if (err.code === 'auth/user-not-found') {
        errMsg = 'no account found for this email address.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'this email address is already registered.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'password is too weak. use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'invalid email address format.';
      }
      setAuthError(errMsg);
    } finally {
      setLoading(false);
    }
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

          {/* Email Signup Option */}
          <TouchableOpacity
            style={styles.emailSignupLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsSignUp(true);
              transitionTo('email');
            }}
          >
            <Text style={styles.emailSignupLinkText}>or sign up with email</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ======================================================== */}
        {/* PHASE 3: EMAIL FORM INPUT (WITH PASSWORD FOR OPTION 1)  */}
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

          <Text style={styles.ssoTitle}>{isSignUp ? 'create account' : 'email login'}</Text>

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

          {/* Password Text Input (Option A: Side-by-side) */}
          <View style={styles.inputWrapper}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputPassword,
                  passFocused && styles.inputFocused,
                  authError && styles.inputError
                ]}
                placeholder="enter your password"
                placeholderTextColor="#8A8E94"
                secureTextEntry={secureText}
                autoCapitalize="none"
                value={password}
                onChangeText={(txt) => {
                  setPassword(txt);
                  if (authError) setAuthError(null);
                }}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIconWrapper}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSecureText(!secureText);
                }}
                activeOpacity={0.7}
              >
                {secureText ? (
                  <EyeOff size={20} color="#8A8E94" />
                ) : (
                  <Eye size={20} color="#0066FF" />
                )}
              </TouchableOpacity>
            </View>
            {authError && <Text style={styles.errorText}>{authError}</Text>}
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
              <Text style={styles.emailSubmitBtnText}>
                {isSignUp ? 'create account' : 'continue'}
              </Text>
            )}
          </TouchableScale>

          {/* Mode Switch Row */}
          <TouchableOpacity
            style={styles.modeSwitchBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsSignUp(!isSignUp);
              setAuthError(null);
            }}
          >
            <Text style={styles.modeSwitchText}>
              {isSignUp ? 'already have an account? ' : "don't have an account? "}
              <Text style={styles.modeSwitchLink}>
                {isSignUp ? 'log in' : 'sign up'}
              </Text>
            </Text>
          </TouchableOpacity>
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
  emailSignupLink: {
    marginTop: Spacing[6],
    paddingVertical: Spacing[2],
  },
  emailSignupLinkText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#0066FF',
    textTransform: 'lowercase',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: Spacing[4],
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  eyeIconWrapper: {
    position: 'absolute',
    right: Spacing[4],
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  inputPassword: {
    paddingRight: 48,
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
    marginTop: Spacing[2],
  },
  emailSubmitBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  modeSwitchBtn: {
    marginTop: Spacing[4],
    paddingVertical: Spacing[2],
  },
  modeSwitchText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: '#60646D',
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  modeSwitchLink: {
    fontFamily: Typography.fontFamily.bold,
    color: '#0066FF',
  },
});
