import React, { useRef, useEffect } from 'react';
import { Animated, TouchableWithoutFeedback, View } from 'react-native';

export function TouchableScale({ children, onPress, disabled, style, scaleTo = 0.95 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={disabled ? null : handlePressIn}
      onPressOut={disabled ? null : handlePressOut}
      onPress={disabled ? null : onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export function FadeInUp({ children, delay = 0, style, duration = 500, distance = 20 }) {
  const translateY = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slide = Animated.timing(translateY, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    });
    const fade = Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    });

    const timeout = setTimeout(() => {
      Animated.parallel([slide, fade]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, duration, distance]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
