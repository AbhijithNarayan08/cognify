import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../theme';
import * as Haptics from 'expo-haptics';
import { t } from '../../constants/useStrings';

export function ConfirmModal({
  visible,
  title,
  body,
  onConfirm,
  onCancel,
  Colors,
  confirmText = 'cancel',
  cancelText = 'keep going',
}) {
  const finalConfirmText = confirmText === 'cancel' ? t('components.confirmModal.confirm') : confirmText;
  const finalCancelText = cancelText === 'keep going' ? t('components.confirmModal.cancel') : cancelText;
  
  const activeColors = Colors || useThemeColors();
  const styles = useMemo(() => getStyles(activeColors), [activeColors]);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, Shadow.lg]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { borderColor: activeColors.border }]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: activeColors.textSecondary }]}>{finalCancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: activeColors.coral }]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: activeColors.textInverse }]}>{finalConfirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing[6],
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  body: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing[6],
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  btnText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.label,
  },
});
