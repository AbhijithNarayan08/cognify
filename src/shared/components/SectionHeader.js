import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors, Typography, Spacing } from '../../theme';

/**
 * SectionHeader — label row with optional action link.
 * @param {{ title: string, action?: string, onAction?: function }} props
 */
export function SectionHeader({ title, action, onAction }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.size.h2,
    color: Colors.textPrimary,
  },
  action: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.body,
    color: Colors.brandPrimary,
  },
});
