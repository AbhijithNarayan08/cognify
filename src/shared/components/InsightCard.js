import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { TouchableScale } from '../motion/Motion';

/**
 * InsightCard — displays a lifestyle insight with coloured accent.
 * Colors are resolved from the 'domain' key at render time — never stored in data.
 * @param {{ headline: string, body: string, domain?: string, accent?: string, bg?: string, onPress?: function }} props
 */
export function InsightCard({ headline, body, domain, accent, bg, onPress }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  // Resolve colors from domain key if explicit accent/bg not provided
  const resolvedAccent = accent || (domain ? Colors.domain?.[domain]?.main : null) || Colors.brandPrimary;
  const resolvedBg = bg || (domain ? Colors.domain?.[domain]?.light : null) || Colors.brandLight;

  return (
    <TouchableScale
      style={[styles.card, { backgroundColor: resolvedBg }, Shadow.sm]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Text style={[styles.headline, { color: resolvedAccent }]}>{headline}</Text>
        <Text style={[styles.body, { color: Colors.textSecondary }]}>{body}</Text>
      </View>
    </TouchableScale>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing[4],
  },
  content: { flex: 1, padding: Spacing[5] },
  headline: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h3,
    marginBottom: Spacing[2],
  },
  body: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.label,
    lineHeight: 22,
  },
});
