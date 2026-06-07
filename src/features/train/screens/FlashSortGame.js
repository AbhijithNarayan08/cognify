import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Circle, Square, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../../theme';
import { FLASH_SORT_STIMULI } from '../../../data/exercises';
import { t } from '../../../constants/useStrings';

export function FlashSortGame({ trialIdx, feedback, onAnswer, Colors }) {
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const stimulus = FLASH_SORT_STIMULI[trialIdx % FLASH_SORT_STIMULI.length];
  const isCircle = stimulus.shape === 'circle';

  return (
    <View style={styles.container}>
      <View style={[
        styles.stimulusBox,
        {
          backgroundColor:
            feedback === 'correct' ? Colors.positiveBg :
            feedback === 'wrong'   ? Colors.warningBg  :
            Colors.surfaceAlt,
        },
      ]}>
        {isCircle ? <Circle size={72} color={Colors.textPrimary} /> : <Square size={72} color={Colors.textPrimary} />}
      </View>
      
      <View style={styles.responseRow}>
        <TouchableOpacity
          style={[styles.responseBtn, { backgroundColor: Colors.domain.memory.main }]}
          onPress={() => onAnswer(isCircle)}
          activeOpacity={0.85}
        >
          <ArrowLeft size={20} color={Colors.textInverse} style={{ marginRight: 4 }} />
          <Text style={styles.responseBtnText}>{t('train.flashSort.circle')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.responseBtn, { backgroundColor: Colors.domain.speed.main }]}
          onPress={() => onAnswer(!isCircle)}
          activeOpacity={0.85}
        >
          <Text style={styles.responseBtnText}>{t('train.flashSort.square')}</Text>
          <ArrowRight size={20} color={Colors.textInverse} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
      <Text style={styles.trialCounter}>{t('train.flashSort.responsesCount', { count: trialIdx })}</Text>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: Spacing[6] },
  stimulusBox: { width: 140, height: 140, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  responseRow: { flexDirection: 'row', gap: Spacing[4], width: '100%', paddingHorizontal: Spacing[6] },
  responseBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', ...Shadow.sm },
  responseBtnText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.label, color: Colors.textInverse },
  trialCounter: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption, color: Colors.textMuted },
});
