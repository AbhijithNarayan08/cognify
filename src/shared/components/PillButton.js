import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useThemeColors, Typography, Spacing, Radius } from '../../theme';
import { TouchableScale } from '../motion/Motion';

const VARIANTS = {
  primary:   (C) => ({ bg: C.brandPrimary, text: C.textInverse }),
  secondary: (C) => ({ bg: C.surface,      text: C.brandPrimary }),
  ghost:     (C) => ({ bg: 'transparent',  text: C.textSecondary }),
};

/**
 * PillButton — branded CTA button with variant support.
 * @param {{ label: string, onPress: function, variant?: 'primary'|'secondary'|'ghost', disabled?: boolean }} props
 */
export function PillButton({ label, onPress, variant = 'primary', disabled = false }) {
  const Colors = useThemeColors();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const v = (VARIANTS[variant] || VARIANTS.primary)(Colors);

  return (
    <TouchableScale
      style={[
        styles.base,
        { backgroundColor: v.bg },
        variant === 'secondary' && styles.secondaryBorder,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </TouchableScale>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    paddingVertical: 18,
    paddingHorizontal: Spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  secondaryBorder: { borderWidth: 2, borderColor: Colors.brandPrimary },
  disabled: { opacity: 0.5 },
  label: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.body },
});
