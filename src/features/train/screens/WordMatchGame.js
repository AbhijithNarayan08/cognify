import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '../../../theme';
import { t } from '../../../constants/useStrings';

const PUZZLES = Array.from({ length: 15 }, (_, i) => ({
  get word() { return t(`train.wordMatch.puzzle.${i}.word`); },
  get prompt() { return t(`train.wordMatch.puzzle.${i}.prompt`); },
  get options() {
    return [
      t(`train.wordMatch.puzzle.${i}.option.0`),
      t(`train.wordMatch.puzzle.${i}.option.1`),
      t(`train.wordMatch.puzzle.${i}.option.2`),
      t(`train.wordMatch.puzzle.${i}.option.3`),
    ];
  },
  get correct() { return t(`train.wordMatch.puzzle.${i}.correct`); },
}));

export function WordMatchGame({ trialIdx, feedback, onAnswer, Colors }) {
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  
  const puzzle = useMemo(() => PUZZLES[trialIdx % PUZZLES.length], [trialIdx]);

  const handleOptionPress = (option) => {
    const isCorrect = option === puzzle.correct;
    onAnswer(isCorrect);
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.wordBox,
        {
          backgroundColor:
            feedback === 'correct' ? Colors.positiveBg :
            feedback === 'wrong'   ? Colors.warningBg  :
            Colors.surfaceAlt,
        }
      ]}>
        <Text style={styles.wordText}>{puzzle.word}</Text>
        <Text style={styles.promptText}>{puzzle.prompt}</Text>
      </View>

      <View style={styles.optionsGrid}>
        {puzzle.options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionBtn, { backgroundColor: Colors.surface }]}
            onPress={() => handleOptionPress(opt)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionBtnText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.trialCounter}>{t('train.wordMatch.answeredCount', { count: trialIdx })}</Text>
    </View>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: Spacing[6], paddingHorizontal: Spacing[6] },
  wordBox: { width: '100%', paddingVertical: Spacing[6], paddingHorizontal: Spacing[4], borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', ...Shadow.md, minHeight: 140 },
  wordText: { fontFamily: Typography.fontFamily.extraBold, fontSize: 32, color: Colors.textPrimary, marginBottom: Spacing[2] },
  promptText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.size.caption, color: Colors.textSecondary },
  optionsGrid: { width: '100%', gap: Spacing[3] },
  optionBtn: { width: '100%', borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  optionBtnText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.size.body, color: Colors.textPrimary },
  trialCounter: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.size.caption, color: Colors.textMuted },
});
