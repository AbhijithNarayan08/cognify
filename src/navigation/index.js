import React from 'react';
import { View, Text, Platform, StyleSheet, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Dumbbell, BarChart2, User } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useThemeColors, Typography, Spacing } from '../theme';

// Onboarding screens
import LoginScreen from '../screens/auth/LoginScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import IntentScreen from '../screens/onboarding/IntentScreen';
import QuickProfileScreen from '../screens/onboarding/QuickProfileScreen';
import {
  AssessmentIntroScreen,
  AssessmentScreen,
  ProcessingScreen,
  ResultsScreen,
} from '../screens/onboarding/AssessmentScreens';
import ProjectionScreen from '../screens/onboarding/ProjectionScreen';
import NotificationOptInScreen from '../screens/onboarding/NotificationOptInScreen';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import { TrainScreen, ActiveSessionScreen, SessionResultScreen } from '../screens/main/TrainScreen';
import InsightsScreen from '../screens/main/InsightsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ── Tab icons ──────────────────────────────
function TabIcon({ name, focused }) {
  const Colors = useThemeColors();
  const color = focused ? Colors.brandPrimary : Colors.textMuted;
  const size = 24;

  switch (name) {
    case 'Home':
      return <Home color={color} size={size} />;
    case 'Train':
      return <Dumbbell color={color} size={size} />;
    case 'Insights':
      return <BarChart2 color={color} size={size} />;
    case 'Profile':
      return <User color={color} size={size} />;
    default:
      return <Home color={color} size={size} />;
  }
}

// ── Home Tab Stack ────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeRoot" component={HomeScreen} />
    </Stack.Navigator>
  );
}

// ── Train Tab Stack ───────────────────────────────────────────────────────
// ── Train Tab Stack ───────────────────────────────────────────────────────
function TrainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainRoot" component={TrainScreen} />
    </Stack.Navigator>
  );
}

// ── Bottom Tab Navigator ──────────────────────────────────────────────────
function MainApp() {
  const Colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'android' ? Colors.surface : 'transparent',
          borderTopColor: Platform.OS === 'android' ? Colors.border : 'transparent',
          elevation: 0,
          borderTopWidth: Platform.OS === 'android' ? 0.5 : 0,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarBackground: Platform.OS === 'ios' ? () => (
          <BlurView 
            tint={useColorScheme() === 'dark' ? 'dark' : 'light'} 
            intensity={80} 
            style={StyleSheet.absoluteFill} 
          />
        ) : undefined,
        tabBarActiveTintColor: Colors.brandPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.medium,
          fontSize: Typography.size.caption,
          textTransform: 'lowercase',
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home"     component={HomeStack}     />
      <Tab.Screen name="Train"    component={TrainStack}    />
      <Tab.Screen name="Insights" component={InsightsScreen}/>
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Global Root App Stack ─────────────────────────────────────────────────
const RootAppStack = createStackNavigator();

function AppStackNavigator() {
  return (
    <RootAppStack.Navigator screenOptions={{ headerShown: false }}>
      <RootAppStack.Screen name="MainTabs" component={MainApp} />
      <RootAppStack.Screen
        name="ActiveSession"
        component={ActiveSessionScreen}
        options={{ presentation: 'modal', gestureEnabled: false }}
      />
      <RootAppStack.Screen
        name="SessionResult"
        component={SessionResultScreen}
        options={{ gestureEnabled: false }}
      />
    </RootAppStack.Navigator>
  );
}

// ── Onboarding Stack ──────────────────────────────────────────────────────
function OnboardingNavigator() {
  const { state } = useApp();
  const isAuthenticated = !!state.user;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            opacity: current.progress,
            transform: [{
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            }],
          },
        }),
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Welcome"         component={WelcomeScreen}        />
          <Stack.Screen name="Intent"          component={IntentScreen}         />
          <Stack.Screen name="QuickProfile"    component={QuickProfileScreen}   />
          <Stack.Screen name="AssessmentIntro" component={AssessmentIntroScreen}/>
          <Stack.Screen name="Assessment"      component={AssessmentScreen}     />
          <Stack.Screen name="Processing"      component={ProcessingScreen}     />
          <Stack.Screen name="Results"         component={ResultsScreen}        />
          <Stack.Screen name="Projection"      component={ProjectionScreen}     />
          <Stack.Screen name="NotificationOptIn" component={NotificationOptInScreen} />
          <Stack.Screen name="MainApp"         component={AppStackNavigator}    options={{ gestureEnabled: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { state } = useApp();
  const isAuthenticated = !!state.user;

  return (
    <NavigationContainer>
      {isAuthenticated && state.onboardingComplete ? (
        <AppStackNavigator />
      ) : (
        <OnboardingNavigator />
      )}
    </NavigationContainer>
  );
}
