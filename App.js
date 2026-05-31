import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigator from './src/navigation';
import { useThemeColors } from './src/theme';

SplashScreen.preventAutoHideAsync();

function AppContent({ onLayout }) {
  const { state } = useApp();
  const Colors = useThemeColors();
  
  return (
    <View style={{ flex: 1, backgroundColor: Colors.appBg }} onLayout={onLayout}>
      <StatusBar style={state.theme === 'dark' ? "light" : "dark"} />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent onLayout={onLayoutRootView} />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
