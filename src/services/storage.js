import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ONBOARDING: 'cognify:onboarding',
  SCORES: 'cognify:scores',
  SESSION: 'cognify:session',
};

export const saveOnboarding = async (state) => {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save onboarding state:', e);
  }
};

export const loadOnboarding = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ONBOARDING);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load onboarding state:', e);
    return null;
  }
};

export const saveScores = async (state) => {
  try {
    await AsyncStorage.setItem(KEYS.SCORES, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save scores state:', e);
  }
};

export const loadScores = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SCORES);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load scores state:', e);
    return null;
  }
};

export const saveSession = async (state) => {
  try {
    await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save session state:', e);
  }
};

export const loadSession = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load session state:', e);
    return null;
  }
};

export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('Failed to clear all storage:', e);
  }
};
