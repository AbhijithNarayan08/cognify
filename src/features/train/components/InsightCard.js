// src/features/train/components/InsightCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Brain, ThumbsUp, ThumbsDown, Check } from 'lucide-react-native';
import { getInsightCopy } from '../games/patternFoldAnalytics';
import { Typography, Spacing, Radius, Shadow } from '../../../theme';

export default function InsightCard({ patternId, Colors }) {
  const [feedback, setFeedback] = useState(null); // 'helpful' | 'unhelpful' | null
  const insightText = getInsightCopy(patternId);

  return (
    <View style={[styles.card, Shadow.sm, { backgroundColor: Colors.surface }]}>
      {/* Title */}
      <View style={styles.header}>
        <Brain size={20} color={Colors.domain.spatial.main} />
        <Text style={[styles.title, { color: Colors.textSecondary }]}>cognitive pattern detected</Text>
      </View>

      {/* Insight Copy */}
      <Text style={styles.body}>{insightText}</Text>

      {/* Feedback Zone */}
      <View style={styles.divider} />
      <View style={styles.feedbackRow}>
        {feedback === null ? (
          <>
            <Text style={[styles.feedbackPrompt, { color: Colors.textMuted }]}>Was this insight accurate?</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.feedbackBtn}
                onPress={() => setFeedback('helpful')}
                activeOpacity={0.8}
              >
                <ThumbsUp size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.feedbackBtn}
                onPress={() => setFeedback('unhelpful')}
                activeOpacity={0.8}
              >
                <ThumbsDown size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.confirmation}>
            <Check size={16} color="#3DC27A" />
            <Text style={styles.confirmationText}>Thank you for your cognitive feedback!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    width: '100%',
    marginVertical: Spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  title: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  body: {
    fontSize: Typography.size.bodyS,
    fontFamily: Typography.fontFamily.medium,
    color: '#333333',
    lineHeight: 18,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#EAEAEA',
    marginVertical: Spacing[3],
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackPrompt: {
    fontSize: Typography.size.caption,
    fontFamily: Typography.fontFamily.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  feedbackBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    width: '100%',
    justifyContent: 'center',
  },
  confirmationText: {
    fontSize: Typography.size.caption,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#3DC27A',
  },
});
