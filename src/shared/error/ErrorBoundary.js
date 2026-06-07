/**
 * ErrorBoundary — catches runtime errors in child components.
 * Wrapping each major screen prevents a single bug from crashing the whole app.
 *
 * Usage:
 *   <ErrorBoundary fallback={<Text>Something went wrong.</Text>}>
 *     <YourScreen />
 *   </ErrorBoundary>
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { t } from '../../constants/useStrings';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // TODO: pipe to crash reporting (Sentry / Crashlytics)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🧠</Text>
          <Text style={styles.title}>{t('error.boundary.title')}</Text>
          <Text style={styles.message}>
            {this.state.error?.message || t('error.boundary.message')}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.handleRetry}>
            <Text style={styles.btnText}>{t('error.boundary.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2A3A',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: '#1B6CA8',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
